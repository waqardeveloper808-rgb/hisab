from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass, asdict, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin

try:
    import requests
    from bs4 import BeautifulSoup
except Exception:  # pragma: no cover
    requests = None
    BeautifulSoup = None


@dataclass
class Issue:
    id: str
    category: str
    severity: str
    title: str
    description: str
    evidence: Dict[str, Any] = field(default_factory=dict)
    recommendation: str = ""
    owner: str = "engineering"
    status: str = "open"


@dataclass
class CheckResult:
    checker: str
    target: str
    passed: bool
    score: float
    summary: str
    issues: List[Issue] = field(default_factory=list)
    evidence: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AuditReport:
    project_name: str
    generated_at: str
    environment: str
    overall_score: float
    totals: Dict[str, int]
    checks: List[CheckResult]
    executive_summary: List[str]
    agent_instruction_block: str


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def safe_slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def is_excluded_path(path: Path, excluded_parts: Tuple[str, ...]) -> bool:
    normalized = path.as_posix().lower()
    return any(part.lower() in normalized for part in excluded_parts)


def make_issue(category: str, severity: str, title: str, description: str,
               evidence: Optional[Dict[str, Any]] = None,
               recommendation: str = "",
               owner: str = "engineering") -> Issue:
    issue_id = f"{safe_slug(category)}-{safe_slug(title)}-{int(time.time() * 1000)}"
    return Issue(
        id=issue_id,
        category=category,
        severity=severity,
        title=title,
        description=description,
        evidence=evidence or {},
        recommendation=recommendation,
        owner=owner,
    )


def save_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)


class BaseChecker:
    name = "base"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        raise NotImplementedError


class HTMLFetchMixin:
    def fetch_html(self, url: str) -> Tuple[Optional[str], Optional[Any], List[Issue]]:
        issues: List[Issue] = []

        if requests is None or BeautifulSoup is None:
            issues.append(make_issue(
                category="runtime",
                severity="high",
                title="Missing dependencies",
                description="requests and beautifulsoup4 are required for web crawling.",
                recommendation="Install dependencies: pip install requests beautifulsoup4",
                owner="devops",
            ))
            return None, None, issues

        try:
            response = requests.get(url, timeout=20)
            html = response.text
            soup = BeautifulSoup(html, "html.parser")
            if response.status_code >= 400:
                issues.append(make_issue(
                    category="links",
                    severity="high",
                    title="Page returned error status",
                    description=f"URL returned HTTP {response.status_code}.",
                    evidence={"url": url, "status_code": response.status_code},
                    recommendation="Fix route, deployment, auth, or server response.",
                ))
            return html, soup, issues
        except Exception as e:
            issues.append(make_issue(
                category="runtime",
                severity="critical",
                title="Page fetch failed",
                description=str(e),
                evidence={"url": url},
                recommendation="Check server availability, DNS, auth, or networking.",
                owner="devops",
            ))
            return None, None, issues

    @staticmethod
    def visible_text(node: Any) -> str:
        return normalize_whitespace(" ".join(node.stripped_strings)) if node else ""


class CTAClarityChecker(BaseChecker, HTMLFetchMixin):
    name = "cta_clarity"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        url = target["url"]
        _, soup, issues = self.fetch_html(url)
        score = 100.0
        if soup is None:
            return CheckResult(self.name, url, False, 0.0, "Could not inspect page.", issues)

        buttons = soup.find_all(["button", "a"])
        empty_actions = []
        vague_labels = []
        banned_cta_words = {w.lower() for w in context.get("banned_cta_words", [])}

        for node in buttons:
            text = self.visible_text(node)
            accessible_bits = [text, node.get("aria-label", ""), node.get("title", "")]
            accessible_bits.extend(img.get("alt", "") for img in node.find_all("img"))
            action_label = normalize_whitespace(" ".join(bit for bit in accessible_bits if bit))
            href = node.get("href") if node.name == "a" else None
            classes = " ".join(node.get("class", []))
            lowered = action_label.lower()
            if (node.name == "button" or href) and not action_label:
                empty_actions.append({"tag": node.name, "href": href, "class": classes})
            elif action_label and (len(action_label) < 3 or lowered in banned_cta_words):
                vague_labels.append({"text": action_label, "tag": node.name, "href": href, "class": classes})

        if empty_actions:
            score -= 35
            issues.append(make_issue(
                category="ux",
                severity="critical",
                title="Empty action element detected",
                description="A button or link appears to have no visible label, causing a broken CTA or ambiguous interaction.",
                evidence={"matches": empty_actions[:10], "count": len(empty_actions)},
                recommendation="Add clear labels such as 'Start Free Trial', 'Create Invoice', or 'Talk to Sales'.",
                owner="frontend",
            ))

        if vague_labels:
            score -= min(20, len(vague_labels) * 4)
            issues.append(make_issue(
                category="copy",
                severity="medium",
                title="Weak action labels detected",
                description="Some actions are too short, too generic, or too system-like to communicate intent clearly.",
                evidence={"matches": vague_labels[:10], "count": len(vague_labels)},
                recommendation="Rewrite labels to be action-driven, outcome-specific, and user-facing.",
                owner="product",
            ))

        passed = not any(i.severity in {"critical", "high"} for i in issues)
        return CheckResult(self.name, url, passed, max(score, 0), "Evaluated CTA clarity and action labels.", issues, {"button_count": len(buttons)})


class LinkIntegrityChecker(BaseChecker, HTMLFetchMixin):
    name = "link_integrity"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        url = target["url"]
        _, soup, issues = self.fetch_html(url)
        score = 100.0
        if soup is None:
            return CheckResult(self.name, url, False, 0.0, "Could not inspect page.", issues)

        anchors = soup.find_all("a", href=True)
        broken_like = []
        placeholders = []

        for a in anchors:
            href = a["href"].strip()
            text = self.visible_text(a)
            if href in {"#", "javascript:void(0)", ""}:
                placeholders.append({"text": text, "href": href})
                continue
            if href.startswith("mailto:") or href.startswith("tel:"):
                continue
            full_url = href if href.startswith("http") else urljoin(url, href)
            try:
                r = requests.head(full_url, allow_redirects=True, timeout=8) if requests else None
                status = r.status_code if r else 0
                if status >= 400:
                    broken_like.append({"text": text, "href": full_url, "status": status})
            except Exception:
                broken_like.append({"text": text, "href": full_url, "status": "request_failed"})

        if placeholders:
            score -= min(20, len(placeholders) * 3)
            issues.append(make_issue(
                category="links",
                severity="high",
                title="Placeholder links detected",
                description="One or more links are non-functional placeholders.",
                evidence={"matches": placeholders[:20], "count": len(placeholders)},
                recommendation="Replace placeholders with real destinations or remove them from production.",
                owner="frontend",
            ))

        if broken_like:
            score -= min(35, len(broken_like) * 5)
            issues.append(make_issue(
                category="links",
                severity="high",
                title="Broken or failing links detected",
                description="One or more links returned an error or could not be resolved.",
                evidence={"matches": broken_like[:20], "count": len(broken_like)},
                recommendation="Fix routes, update URLs, or remove dead destinations.",
                owner="frontend",
            ))

        passed = not any(i.severity in {"critical", "high"} for i in issues)
        return CheckResult(self.name, url, passed, max(score, 0), "Validated links and placeholder actions.", issues, {"link_count": len(anchors)})


class HeadlineStructureChecker(BaseChecker, HTMLFetchMixin):
    name = "headline_structure"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        url = target["url"]
        _, soup, issues = self.fetch_html(url)
        score = 100.0
        if soup is None:
            return CheckResult(self.name, url, False, 0.0, "Could not inspect page.", issues)

        h1s = soup.find_all("h1")
        h2s = soup.find_all("h2")

        if len(h1s) == 0:
            score -= 20
            issues.append(make_issue("structure", "high", "Missing H1", "Page does not have a primary H1 heading.", recommendation="Add exactly one clear H1 describing the page's main purpose.", owner="frontend"))
        elif len(h1s) > 1:
            score -= 15
            issues.append(make_issue("structure", "medium", "Multiple H1 headings", "Page contains more than one H1 which weakens hierarchy and accessibility.", evidence={"count": len(h1s)}, recommendation="Use one H1 and demote the rest to H2/H3 as needed.", owner="frontend"))

        if len(h2s) == 0:
            score -= 8
            issues.append(make_issue("structure", "low", "No H2 sections found", "Page has weak section hierarchy.", recommendation="Break long pages into clearly labeled sections using H2s.", owner="frontend"))

        passed = not any(i.severity in {"critical", "high"} for i in issues)
        return CheckResult(self.name, url, passed, max(score, 0), "Checked heading hierarchy.", issues, {"h1_count": len(h1s), "h2_count": len(h2s)})


class InternalLabelLeakChecker(BaseChecker, HTMLFetchMixin):
    name = "internal_label_leaks"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        url = target["url"]
        _, soup, issues = self.fetch_html(url)
        score = 100.0
        if soup is None:
            return CheckResult(self.name, url, False, 0.0, "Could not inspect page.", issues)

        banned_labels = {label.lower() for label in context.get("banned_ui_labels", [])}
        leaked = []
        nodes = soup.find_all(["span", "div", "p", "small", "strong", "a", "button", "label"])

        for node in nodes:
            text = self.visible_text(node)
            if text and text.lower() in banned_labels:
                leaked.append({"text": text, "tag": node.name, "class": " ".join(node.get("class", []))})

        if leaked:
            score -= min(45, len(leaked) * 6)
            issues.append(make_issue(
                category="ux",
                severity="high",
                title="Internal or placeholder UI labels leaked to production UI",
                description="Developer shorthand, system tags, or generic placeholders are visible to end users.",
                evidence={"matches": leaked[:30], "count": len(leaked)},
                recommendation="Remove internal abbreviations and placeholder badge words from user-facing surfaces.",
                owner="frontend",
            ))

        passed = not any(i.severity in {"critical", "high"} for i in issues)
        return CheckResult(self.name, url, passed, max(score, 0), "Checked for leaked developer labels.", issues, {"banned_labels_checked": len(banned_labels)})


class CardHygieneChecker(BaseChecker, HTMLFetchMixin):
    name = "card_hygiene"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        url = target["url"]
        _, soup, issues = self.fetch_html(url)
        score = 100.0
        if soup is None:
            return CheckResult(self.name, url, False, 0.0, "Could not inspect page.", issues)

        cards = soup.find_all(["article", "section", "div"])
        suspicious_cards = []
        repeated_module_noise = []
        badge_words = {w.lower() for w in context.get("suspicious_badge_words", [])}

        for node in cards:
            classes = " ".join(node.get("class", []))
            text = self.visible_text(node)
            if not text:
                continue
            short_tokens = re.findall(r"\b[A-Z]{2,3}\b", text)
            found_badges = [token for token in short_tokens if token.lower() in badge_words]
            module_count = len(re.findall(r"\bmodule\b", text, flags=re.IGNORECASE))
            if found_badges and module_count:
                suspicious_cards.append({"class": classes, "badges": found_badges, "text_preview": text[:180]})
            if module_count > 1:
                repeated_module_noise.append({"class": classes, "module_count": module_count, "text_preview": text[:180]})

        if suspicious_cards:
            score -= min(35, len(suspicious_cards) * 7)
            issues.append(make_issue(
                category="visuals",
                severity="high",
                title="Card badge system looks like internal taxonomy, not polished UX",
                description="Cards expose internal tag chips or shorthand instead of clean, product-grade presentation.",
                evidence={"matches": suspicious_cards[:20], "count": len(suspicious_cards)},
                recommendation="Remove shorthand chips and generic 'Module' pills unless they serve a clear user purpose.",
                owner="frontend",
            ))

        if repeated_module_noise:
            score -= min(15, len(repeated_module_noise) * 4)
            issues.append(make_issue(
                category="visuals",
                severity="medium",
                title="Repeated decorative badge words detected",
                description="Visual chip language appears repetitive and noisy.",
                evidence={"matches": repeated_module_noise[:20], "count": len(repeated_module_noise)},
                recommendation="Reduce decorative repetition and preserve one strong signal per card.",
                owner="design",
            ))

        passed = not any(i.severity in {"critical", "high"} for i in issues)
        return CheckResult(self.name, url, passed, max(score, 0), "Checked card cleanliness and UI noise.", issues, {})


class PlaceholderCopyChecker(BaseChecker, HTMLFetchMixin):
    name = "placeholder_copy"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        url = target["url"]
        html, soup, issues = self.fetch_html(url)
        score = 100.0
        if soup is None or html is None:
            return CheckResult(self.name, url, False, 0.0, "Could not inspect page.", issues)

        findings = []
        for pattern in context.get("placeholder_copy_patterns", []):
            for match in re.finditer(pattern, html, flags=re.IGNORECASE):
                findings.append({"pattern": pattern, "match": match.group(0)[:100]})
                if len(findings) >= 30:
                    break
            if len(findings) >= 30:
                break

        if findings:
            score -= min(30, len(findings) * 3)
            issues.append(make_issue(
                category="copy",
                severity="high",
                title="Placeholder or draft copy found",
                description="User-facing HTML contains unfinished copy, tokens, or draft placeholders.",
                evidence={"matches": findings, "count": len(findings)},
                recommendation="Replace placeholder text with final, brand-safe user-facing copy.",
                owner="product",
            ))

        passed = not any(i.severity in {"critical", "high"} for i in issues)
        return CheckResult(self.name, url, passed, max(score, 0), "Checked rendered HTML for placeholder and draft copy.", issues, {})


class RouteAvailabilityChecker(BaseChecker, HTMLFetchMixin):
    name = "route_availability"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        url = target["url"]
        html, soup, issues = self.fetch_html(url)
        score = 100.0
        if soup is None or html is None:
            return CheckResult(self.name, url, False, 0.0, "Could not inspect route availability.", issues)

        text = normalize_whitespace(soup.get_text(" ", strip=True)).lower()
        expected_text = [item.lower() for item in target.get("expected_text", [])]
        expected_status = target.get("expected_status", 200)
        expected_statuses = expected_status if isinstance(expected_status, list) else [expected_status]
        reject_text = [item.lower() for item in target.get("reject_text", ([] if any(status >= 400 for status in expected_statuses) else ["page not found", "404"]))]
        forbidden_text = [item.lower() for item in target.get("forbidden_text", [])]

        response_status_issue = next((issue for issue in issues if issue.title == "Page returned error status"), None)
        actual_status = response_status_issue.evidence.get("status_code") if response_status_issue else 200
        if response_status_issue:
            if actual_status in expected_statuses:
                issues = [issue for issue in issues if issue is not response_status_issue]
            else:
                score -= 60
                response_status_issue.title = "Route returned failing status"
                response_status_issue.description = "This route did not return the expected status."
                response_status_issue.recommendation = "Fix the route, redirect, or remove the navigation entry from production."
        elif actual_status not in expected_statuses:
            score -= 45
            issues.append(make_issue(
                category="routes",
                severity="high",
                title="Route returned unexpected status",
                description="The route responded successfully but not with the expected HTTP status for this audit target.",
                evidence={"url": url, "actual_status": actual_status, "expected_status": expected_statuses},
                recommendation="Align the route response with the expected page state.",
                owner="frontend",
            ))

        missing = [item for item in expected_text if item not in text]
        if missing:
            score -= min(25, len(missing) * 6)
            issues.append(make_issue(
                category="routes",
                severity="medium",
                title="Expected route content missing",
                description="The route loaded but did not render one or more expected text markers.",
                evidence={"url": url, "missing": missing},
                recommendation="Verify the route is rendering the intended page and not falling back to the wrong state.",
                owner="frontend",
            ))

        found_rejects = [item for item in reject_text if item in text]
        if found_rejects:
            score -= min(45, len(found_rejects) * 10)
            issues.append(make_issue(
                category="routes",
                severity="high",
                title="Route contains error-state copy",
                description="The route rendered text associated with a failing or fallback state.",
                evidence={"url": url, "matches": found_rejects},
                recommendation="Fix the route or replace fallback rendering with the intended page content.",
                owner="frontend",
            ))

        found_forbidden = [item for item in forbidden_text if item in text]
        if found_forbidden:
            score -= min(40, len(found_forbidden) * 10)
            issues.append(make_issue(
                category="routes",
                severity="high",
                title="Route contains forbidden shell content",
                description="The route rendered chrome or labels that do not belong on this page state.",
                evidence={"url": url, "matches": found_forbidden},
                recommendation="Render the correct not-found boundary or page shell for this route.",
                owner="frontend",
            ))

        passed = not any(i.severity in {"critical", "high"} for i in issues)
        return CheckResult(self.name, url, passed, max(score, 0), "Validated route response and expected page content.", issues, {"expected_text": expected_text})


class LogoPresenceChecker(BaseChecker, HTMLFetchMixin):
    name = "logo_presence"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        url = target["url"]
        _, soup, issues = self.fetch_html(url)
        score = 100.0
        if soup is None:
            return CheckResult(self.name, url, False, 0.0, "Could not inspect logo presence.", issues)

        expected_status = target.get("expected_status", 200)
        expected_statuses = expected_status if isinstance(expected_status, list) else [expected_status]
        response_status_issue = next((issue for issue in issues if issue.title == "Page returned error status"), None)
        if response_status_issue and response_status_issue.evidence.get("status_code") in expected_statuses:
            issues = [issue for issue in issues if issue is not response_status_issue]

        logo_selectors = target.get("logo_selectors", [
            'img[alt="Gulf Hisab"]',
            'img[alt="Gulf Hisab icon"]',
            'img[src="/gulf-hisab-wordmark.svg"]',
            'img[src="/icon.svg"]',
        ])

        found = []
        for selector in logo_selectors:
            found.extend(soup.select(selector))

        brand_link_selectors = target.get("brand_link_selectors", [
            'a[aria-label*="Gulf Hisab"]',
            'a[title*="Gulf Hisab"]',
        ])
        found_links = []
        for selector in brand_link_selectors:
            found_links.extend(soup.select(selector))

        if not found:
            score -= 70
            issues.append(make_issue(
                category="branding",
                severity="high",
                title="Official Gulf Hisab logo not detected",
                description="The inspected page did not render the expected official wordmark or icon asset.",
                evidence={"url": url, "selectors": logo_selectors},
                recommendation="Render the official Gulf Hisab SVG wordmark or icon on this surface.",
                owner="frontend",
            ))

        if not found_links:
            score -= 15
            issues.append(make_issue(
                category="branding",
                severity="medium",
                title="Brand navigation label missing",
                description="The page renders branding assets but not an accessible branded home link label.",
                evidence={"url": url, "selectors": brand_link_selectors},
                recommendation="Add an accessible brand link label using aria-label or title.",
                owner="frontend",
            ))

        passed = not any(i.severity in {"critical", "high"} for i in issues)
        return CheckResult(self.name, url, passed, max(score, 0), "Checked for official logo presence.", issues, {"logo_count": len(found), "brand_link_count": len(found_links)})


class TemplateContentChecker(BaseChecker):
    name = "template_content"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        file_path = Path(target["path"])
        issues: List[Issue] = []
        score = 100.0
        if not file_path.exists():
            issues.append(make_issue("templates", "critical", "Template file missing", f"Template not found: {file_path}", recommendation="Restore the missing template or fix the configured path.", owner="backend"))
            return CheckResult(self.name, str(file_path), False, 0.0, "Template file missing.", issues)

        text = file_path.read_text(encoding="utf-8", errors="ignore")
        missing = [token for token in context.get("required_template_tokens", []) if token not in text]
        if missing:
            score -= min(40, len(missing) * 6)
            issues.append(make_issue("templates", "high", "Required template elements missing", "Some required business placeholders or sections are missing from the template.", evidence={"missing_tokens": missing, "path": str(file_path)}, recommendation="Add the required placeholders/sections and verify rendering output.", owner="backend"))

        noise = [term for term in context.get("template_noise_terms", []) if term.lower() in text.lower()]
        if noise:
            score -= min(15, len(noise) * 3)
            issues.append(make_issue("templates", "medium", "Draft content found in template", "Template contains placeholder text, demo text, or development markers.", evidence={"matches": noise}, recommendation="Replace draft content before release.", owner="backend"))

        passed = not any(i.severity in {"critical", "high"} for i in issues)
        return CheckResult(self.name, str(file_path), passed, max(score, 0), "Validated template completeness.", issues, {"file_size": file_path.stat().st_size})


class RegisterSchemaChecker(BaseChecker):
    name = "register_schema"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        file_path = Path(target["path"])
        issues: List[Issue] = []
        score = 100.0
        if not file_path.exists():
            issues.append(make_issue("registers", "critical", "Register definition missing", f"Schema/config file not found: {file_path}", recommendation="Restore the file or point the audit config to the correct path.", owner="backend"))
            return CheckResult(self.name, str(file_path), False, 0.0, "Register definition missing.", issues)

        text = file_path.read_text(encoding="utf-8", errors="ignore")
        missing_fields = [field for field in context.get("required_register_fields", []) if field not in text]
        if missing_fields:
            score -= min(50, len(missing_fields) * 5)
            issues.append(make_issue("registers", "high", "Register fields missing", "One or more mandatory fields are missing from the register schema/config.", evidence={"missing_fields": missing_fields, "path": str(file_path)}, recommendation="Add the missing fields so registers support full business tracking.", owner="backend"))

        passed = not any(i.severity in {"critical", "high"} for i in issues)
        return CheckResult(self.name, str(file_path), passed, max(score, 0), "Checked register schema completeness.", issues, {"required_fields_checked": len(context.get('required_register_fields', []))})


class ArchitectureConventionChecker(BaseChecker):
    name = "architecture_conventions"

    def run(self, target: Dict[str, Any], context: Dict[str, Any]) -> CheckResult:
        repo_root = Path(target["repo_root"])
        issues: List[Issue] = []
        score = 100.0
        missing_paths = [p for p in context.get("expected_paths", []) if not (repo_root / p).exists()]
        if missing_paths:
            score -= min(35, len(missing_paths) * 5)
            issues.append(make_issue("architecture", "high", "Expected architectural paths missing", "Important folders/files expected by your architecture are absent.", evidence={"missing_paths": missing_paths, "repo_root": str(repo_root)}, recommendation="Create the missing directories/modules or update the architecture standard.", owner="engineering"))

        excluded_parts = tuple(context.get("excluded_paths", ["node_modules", ".next", "backend/vendor", "qa_reports", "qa_fixer_backups", ".git", "storage"]))
        risky_files = []
        for pattern in context.get("anti_patterns", []):
            risky_files.extend([str(p) for p in repo_root.rglob(pattern) if not is_excluded_path(p, excluded_parts)])
        if risky_files:
            score -= min(25, len(risky_files) * 2)
            issues.append(make_issue("architecture", "medium", "Potential architecture anti-patterns found", "Some files or patterns suggest architectural drift.", evidence={"matches": risky_files[:30]}, recommendation="Review and refactor files that bypass intended layers or boundaries.", owner="engineering"))

        passed = not any(i.severity in {"critical", "high"} for i in issues)
        return CheckResult(self.name, str(repo_root), passed, max(score, 0), "Checked architecture shape against conventions.", issues, {"expected_paths_checked": len(context.get('expected_paths', []))})


class QAOrchestrator:
    def __init__(self, config: Dict[str, Any]) -> None:
        self.config = config
        self.checkers = {
            "cta_clarity": CTAClarityChecker(),
            "link_integrity": LinkIntegrityChecker(),
            "headline_structure": HeadlineStructureChecker(),
            "internal_label_leaks": InternalLabelLeakChecker(),
            "card_hygiene": CardHygieneChecker(),
            "placeholder_copy": PlaceholderCopyChecker(),
            "route_availability": RouteAvailabilityChecker(),
            "logo_presence": LogoPresenceChecker(),
            "template_content": TemplateContentChecker(),
            "register_schema": RegisterSchemaChecker(),
            "architecture_conventions": ArchitectureConventionChecker(),
        }

    def run(self) -> AuditReport:
        results: List[CheckResult] = []
        for item in self.config.get("targets", []):
            target_label = item.get("url") or item.get("path") or item.get("repo_root") or "unknown-target"
            for checker_name in item.get("checkers", []):
                checker = self.checkers.get(checker_name)
                if checker:
                    print(f"[QA] Running {checker_name} on {target_label}")
                    results.append(checker.run(item, self.config))

        overall_score = round(sum(r.score for r in results) / len(results), 2) if results else 0.0
        totals = self._build_totals(results)
        summary = self._build_summary(results, overall_score)
        agent_block = self._build_agent_instruction_block(results)
        return AuditReport(self.config.get("project_name", "Unknown Project"), now_iso(), self.config.get("environment", "unknown"), overall_score, totals, results, summary, agent_block)

    def _build_totals(self, results: List[CheckResult]) -> Dict[str, int]:
        totals = {"checks": len(results), "passed_checks": sum(1 for r in results if r.passed), "failed_checks": sum(1 for r in results if not r.passed), "critical": 0, "high": 0, "medium": 0, "low": 0}
        for r in results:
            for issue in r.issues:
                sev = issue.severity.lower()
                if sev in totals:
                    totals[sev] += 1
        return totals

    def _build_summary(self, results: List[CheckResult], overall_score: float) -> List[str]:
        messages = [f"Overall QA health score: {overall_score}/100."]
        critical = sum(1 for r in results for i in r.issues if i.severity == "critical")
        high = sum(1 for r in results for i in r.issues if i.severity == "high")
        if critical:
            messages.append(f"Critical blockers detected: {critical}.")
        if high:
            messages.append(f"High-severity issues detected: {high}.")
        if not critical and not high:
            messages.append("No critical/high blockers detected in the current audit scope.")
        weakest = sorted(results, key=lambda r: r.score)[:4]
        if weakest:
            messages.append("Weakest areas: " + ", ".join(f"{r.checker} ({r.score})" for r in weakest))
        return messages

    def _build_agent_instruction_block(self, results: List[CheckResult]) -> str:
        issues = [issue for result in results for issue in result.issues]
        issues_sorted = sorted(issues, key=lambda i: {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(i.severity, 9))
        lines = [
            "You are a Senior Product QA Fix Agent working on Gulf Hisab.",
            "",
            "Rules:",
            "- Do not ask questions.",
            "- Do not stop after one fix.",
            "- Fix highest severity issues first.",
            "- Remove all user-facing developer artifacts.",
            "- Preserve architecture and existing working flows.",
            "- Do not redesign unrelated areas.",
            "- After each fix, verify the affected flow still works.",
            "- Prioritize polished SaaS clarity over decorative chips or taxonomy leakage.",
            "",
            "Priority issues to resolve:",
        ]
        for idx, issue in enumerate(issues_sorted[:30], start=1):
            lines.append(f"{idx}. [{issue.severity.upper()}] {issue.category}: {issue.title} — {issue.description}")
            if issue.recommendation:
                lines.append(f"   Fix guidance: {issue.recommendation}")
        if not issues_sorted:
            lines.append("No actionable issues found in this audit scope.")
        lines.extend(["", "Deliverables:", "- Updated code", "- Brief change log", "- Recheck results for each resolved issue", "- Confirm no internal abbreviations, placeholder chips, or broken CTAs remain visible"])
        return "\n".join(lines)


def default_config() -> Dict[str, Any]:
    return {
        "project_name": "Gulf Hisab",
        "environment": "local",
        "banned_cta_words": ["go", "more", "next"],
        "banned_ui_labels": ["module", "tag", "badge", "feature card", "structured placeholder", "sandbox mode", "iv", "vt", "za", "wa", "rp"],
        "suspicious_badge_words": ["module"],
        "placeholder_copy_patterns": [r"lorem ipsum", r"coming soon", r"todo", r"tbd", r"placeholder", r"dummy text", r"sample text", r"structured placeholder", r"widget"],
        "required_template_tokens": ["company_name", "invoice_number", "invoice_date", "customer_name", "vat_number", "subtotal", "tax_amount", "total_amount"],
        "template_noise_terms": ["TODO", "Lorem ipsum", "coming soon", "placeholder"],
        "required_register_fields": ["status", "customer_id", "document_number", "issue_date", "due_date", "currency", "subtotal", "tax_total", "grand_total"],
        "expected_paths": ["app", "components", "data", "lib", "backend/app/Services", "backend/app/Http/Controllers", "backend/database/migrations", "qa"],
        "anti_patterns": ["*.bak", "*copy*.*"],
        "excluded_paths": ["node_modules", ".next", "backend/vendor", "qa_reports", "qa_fixer_backups", ".git", "storage"],
        "targets": [
            {"url": "http://127.0.0.1:3001", "expected_text": ["Gulf Hisab", "Start Free Trial", "ZATCA invoicing"], "checkers": ["route_availability", "cta_clarity", "link_integrity", "headline_structure", "internal_label_leaks", "card_hygiene", "placeholder_copy", "logo_presence"]},
            {"url": "http://127.0.0.1:3001/products", "expected_text": ["Products", "Gulf Hisab"], "checkers": ["route_availability", "headline_structure", "internal_label_leaks", "logo_presence"]},
            {"url": "http://127.0.0.1:3001/plans", "expected_text": ["Pricing", "trial"], "checkers": ["route_availability", "cta_clarity", "headline_structure", "logo_presence"]},
            {"url": "http://127.0.0.1:3001/helpdesk-ai", "expected_text": ["Help", "Gulf Hisab"], "checkers": ["route_availability", "headline_structure", "logo_presence"]},
            {"url": "http://127.0.0.1:3001/login", "expected_text": ["Log in"], "checkers": ["route_availability", "cta_clarity", "headline_structure", "logo_presence"]},
            {"url": "http://127.0.0.1:3001/register", "expected_text": ["Start free trial"], "checkers": ["route_availability", "cta_clarity", "headline_structure", "logo_presence"]},
            {"url": "http://127.0.0.1:3001/workspace/user", "expected_text": ["User Workspace", "Total Sales"], "checkers": ["route_availability", "link_integrity", "internal_label_leaks", "placeholder_copy", "logo_presence"]},
            {"url": "http://127.0.0.1:3001/workspace/admin", "expected_text": ["Admin Workspace", "Customer control"], "checkers": ["route_availability", "link_integrity", "internal_label_leaks", "logo_presence"]},
            {"url": "http://127.0.0.1:3001/workspace/assistant", "expected_text": ["Assistant workspace", "Support"], "checkers": ["route_availability", "link_integrity", "internal_label_leaks", "logo_presence"]},
            {"url": "http://127.0.0.1:3001/workspace/agent", "expected_text": ["Agent Workspace", "referral"], "checkers": ["route_availability", "link_integrity", "internal_label_leaks", "logo_presence"]},
            {"url": "http://127.0.0.1:3001/workspace/admin/audit", "expected_text": ["Audit Engine", "QA/QC Engine"], "checkers": ["route_availability", "headline_structure", "internal_label_leaks", "placeholder_copy", "logo_presence"]},
            {"url": "http://127.0.0.1:3001/this-route-does-not-exist", "expected_status": 404, "expected_text": ["Page not found", "This page is not available"], "forbidden_text": ["Admin Workspace", "Assistant Workspace", "Agent Workspace"], "checkers": ["route_availability", "logo_presence"]},
            {"repo_root": ".", "checkers": ["architecture_conventions"]},
        ],
    }


def report_to_dict(report: AuditReport) -> Dict[str, Any]:
    return {
        "project_name": report.project_name,
        "generated_at": report.generated_at,
        "environment": report.environment,
        "overall_score": report.overall_score,
        "totals": report.totals,
        "executive_summary": report.executive_summary,
        "checks": [
            {
                "checker": r.checker,
                "target": r.target,
                "passed": r.passed,
                "score": r.score,
                "summary": r.summary,
                "evidence": r.evidence,
                "issues": [asdict(i) for i in r.issues],
            }
            for r in report.checks
        ],
        "agent_instruction_block": report.agent_instruction_block,
    }


def main() -> None:
    config_path = os.environ.get("GH_QA_CONFIG", "gh_qa_config.json")
    print(f"[QA] Loading config from {config_path}")
    if Path(config_path).exists():
        config = json.loads(Path(config_path).read_text(encoding="utf-8"))
    else:
        config = default_config()
        save_json(Path(config_path), config)
        print(f"Created starter config at {config_path}")

    orchestrator = QAOrchestrator(config)
    report = orchestrator.run()
    output_path = Path("qa_reports") / f"qa_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    save_json(output_path, report_to_dict(report))
    print(f"QA report generated: {output_path}")
    print(json.dumps({"overall_score": report.overall_score, "totals": report.totals, "executive_summary": report.executive_summary}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
