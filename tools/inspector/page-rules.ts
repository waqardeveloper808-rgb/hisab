import { JSDOM } from "jsdom";
import type { BrowserContext, Page, Response } from "playwright";
import type { InspectRouteConfig, NetworkCall, NetworkFailure } from "./route-catalog";

type DomEvidence = {
  tableFound: boolean;
  rowCount: number;
  filtersFound: boolean;
  actionsFound: string[];
  splitViewFound: boolean;
  splitViewSideBySide: boolean | null;
  previewSurfaceFound: boolean;
  previewActionsFound: string[];
  importExportFound: boolean;
  rowClickableFound: boolean;
  guidanceCount: number;
  createTargets: string[];
  qrInsideRegister: boolean;
  routeOwner: string | null;
  dataMode: string | null;
  workflowForm: string | null;
  workflowMarkers: string[];
  inlineCreateMarkers: string[];
  registerMarkers: string[];
  realRegisterMarkers: string[];
  fillerMatches: string[];
  emptyStateTexts: string[];
  wastedSpaceReasons: string[];
  overflowIssues: string[];
  duplicateTopLevelHeadings: string[];
  duplicateHeaders: string[];
  layoutIssues: string[];
  deadLinkCandidates: string[];
  sameOriginLinks: Array<{ text: string; href: string }>;
  qrCandidates: Array<{ selector: string; tag: string; label: string }>;
  visibleText: string;
};

type ApiCallTally = {
  method: string;
  url: string;
  count: number;
};

export type RouteInspectionArtifacts = {
  dom: DomEvidence;
  apiCalls: NetworkCall[];
  apiCallTallies: ApiCallTally[];
  networkFailures: NetworkFailure[];
  linkFindings: string[];
};

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function sanitizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

export async function inspectRoutePage(
  page: Page,
  context: BrowserContext,
  baseUrl: string,
  route: InspectRouteConfig,
): Promise<RouteInspectionArtifacts> {
  const apiCalls: NetworkCall[] = [];
  const networkFailures: NetworkFailure[] = [];

  const responseListener = (response: Response) => {
    const request = response.request();
    const url = response.url();

    if (!url.startsWith(baseUrl) || !url.includes("/api/")) {
      return;
    }

    const call: NetworkCall = {
      method: request.method(),
      status: response.status(),
      url: sanitizeUrl(url),
      resourceType: request.resourceType(),
    };

    apiCalls.push(call);

    if (response.status() >= 400) {
      networkFailures.push({
        ...call,
        reason: response.statusText(),
      });
    }
  };

  page.on("response", responseListener);

  await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  const html = await page.content();
  const parsed = new JSDOM(html);
  const document = parsed.window.document;
  const main = document.querySelector("main") ?? document.body;
  const normalizeText = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();
  const makeSelector = (element: Element) => {
    const htmlElement = element as HTMLElement;
    if (htmlElement.id) {
      return `#${htmlElement.id}`;
    }

    const className = typeof htmlElement.className === "string"
      ? htmlElement.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".")
      : "";

    return className ? `${htmlElement.tagName.toLowerCase()}.${className}` : htmlElement.tagName.toLowerCase();
  };
  const actionsFound = unique(
    Array.from(main.querySelectorAll("a, button"))
      .map((element) => normalizeText(element.textContent))
      .filter((value) => value.length > 0 && value.length <= 48),
  ).slice(0, 24);
  const splitViewFound = document.querySelector("[data-inspector-split-view='true']") !== null;
  const previewSurfaceFound = document.querySelector("[data-inspector-preview-surface='true']") !== null;
  const previewActionsFound = unique(
    Array.from(document.querySelectorAll("[data-inspector-issued-actions='true'] a, [data-inspector-issued-actions='true'] button"))
      .map((element) => normalizeText(element.textContent))
      .filter((value) => value.length > 0 && value.length <= 48),
  );
  const importExportFound = document.querySelector("[data-inspector-import-export='true']") !== null;
  const rowClickableFound = document.querySelector("[data-inspector-row-clickable='true']") !== null;
  const guidanceCount = document.querySelectorAll("[data-inspector-guidance='true']").length;
  const createTargets = unique(
    Array.from(document.querySelectorAll("[data-inspector-create-href]"))
      .map((element) => element.getAttribute("data-inspector-create-href") ?? "")
      .filter(Boolean),
  );
  const qrInsideRegister = document.querySelector("table [data-zatca-qr='true'], table img[alt*='QR' i], table img[alt*='ZATCA' i], table canvas[aria-label*='QR' i], table svg[aria-label*='QR' i]") !== null;
  const tables = Array.from(main.querySelectorAll("table"));
  const dataRows = tables.flatMap((table) => Array.from(table.querySelectorAll("tbody tr"))).filter((row) => {
    const rowText = normalizeText(row.textContent).toLowerCase();
    return row.children.length > 1
      && !rowText.includes("loading")
      && !rowText.includes("no invoices")
      && !rowText.includes("no templates")
      && !rowText.includes("select a template");
  });
  const filterControls = Array.from(main.querySelectorAll("input, select, [role='combobox']"));
  const emptyStateTexts = unique(
    Array.from(main.querySelectorAll("td, p, div"))
      .map((element) => normalizeText(element.textContent))
      .filter((value) => value.length > 0 && value.length <= 180)
      .filter((value) => /no .*yet|no .*match|select a template to edit|loading|not available right now/i.test(value)),
  );
  const mainText = normalizeText(main.textContent);
  const fillerMatches = route.placeholderMarkers.filter((marker) => mainText.includes(marker));
  const routeOwner = document.querySelector("[data-inspector-route-owner]")?.getAttribute("data-inspector-route-owner") ?? null;
  const dataMode = document.querySelector("[data-inspector-workspace-mode]")?.getAttribute("data-inspector-workspace-mode")
    ?? document.querySelector("[data-inspector-data-mode]")?.getAttribute("data-inspector-data-mode")
    ?? null;
  const workflowForm = document.querySelector("[data-inspector-workflow-form]")?.getAttribute("data-inspector-workflow-form") ?? null;
  const workflowMarkers = unique(
    Array.from(document.querySelectorAll("[data-inspector-workflow-step]"))
      .map((element) => element.getAttribute("data-inspector-workflow-step") ?? "")
      .filter(Boolean),
  );
  const inlineCreateMarkers = unique(
    [
      document.querySelector("[data-inspector-inline-create-contact='true']") ? "contact" : "",
      document.querySelector("[data-inspector-inline-create-item='true']") ? "item" : "",
    ].filter(Boolean),
  );
  const registerMarkers = unique(
    Array.from(document.querySelectorAll("[data-inspector-register]"))
      .map((element) => element.getAttribute("data-inspector-register") ?? "")
      .filter(Boolean),
  );
  const realRegisterMarkers = unique(
    Array.from(document.querySelectorAll("[data-inspector-real-register]"))
      .map((element) => element.getAttribute("data-inspector-real-register") ?? "")
      .filter(Boolean),
  );
  const duplicateTopLevelHeadings = unique(
    Array.from(document.querySelectorAll("h1"))
      .map((element) => normalizeText(element.textContent))
      .filter((heading, index, collection) => heading.length > 0 && collection.indexOf(heading) !== index),
  );
  const duplicateHeaders = unique(
    Array.from(document.querySelectorAll("h1, h2"))
      .map((element) => normalizeText(element.textContent))
      .filter((heading, index, collection) => heading.length > 0 && collection.indexOf(heading) !== index),
  );
  const documentH1Count = document.querySelectorAll("h1").length;
  const layoutIssues = [
    ...(documentH1Count > 1 ? [`Document renders ${documentH1Count} H1 elements.`] : []),
    ...duplicateTopLevelHeadings.map((heading) => `Duplicate top-level heading detected: ${heading}`),
  ];
  const deadLinkCandidates = Array.from(main.querySelectorAll("a[href]"))
    .map((anchor) => {
      const href = anchor.getAttribute("href") ?? "";
      const label = normalizeText(anchor.textContent);
      return !href || href === "#" || href.startsWith("javascript:")
        ? (label || href || makeSelector(anchor))
        : "";
    })
    .filter(Boolean);
  const sameOriginLinks = Array.from(main.querySelectorAll("a[href]"))
    .map((anchor) => ({
      text: normalizeText(anchor.textContent),
      href: anchor.getAttribute("href") ?? "",
    }))
    .filter((link) => link.href.startsWith("/"));
  const qrCandidates = Array.from(main.querySelectorAll("img, canvas, svg"))
    .map((element) => ({
      selector: makeSelector(element),
      tag: element.tagName.toLowerCase(),
      label: [
        element.getAttribute("alt") ?? "",
        element.getAttribute("aria-label") ?? "",
        element.getAttribute("data-testid") ?? "",
        element.id,
        typeof (element as HTMLElement).className === "string" ? (element as HTMLElement).className : "",
      ].join(" "),
    }))
    .filter((candidate) => /qr|zatca|invoice/i.test(candidate.label));
  const overflowIssues: string[] = [];
  const wastedSpaceReasons: string[] = [];
  let splitViewSideBySide: boolean | null = null;

  if (splitViewFound && previewSurfaceFound) {
    const registerBox = await page.locator("table").first().boundingBox().catch(() => null);
    const previewBox = await page.locator("[data-inspector-preview-surface='true']").first().boundingBox().catch(() => null);

    if (registerBox && previewBox) {
      splitViewSideBySide = previewBox.x > registerBox.x + (registerBox.width * 0.45)
        && Math.abs(previewBox.y - registerBox.y) < 160;
    }
  }

  const mainChildren = page.locator("main > *");
  const childCount = Math.min(await mainChildren.count(), 8);

  for (let index = 0; index < childCount; index += 1) {
    const child = mainChildren.nth(index);
    const box = await child.boundingBox();
    const text = normalizeText(await child.textContent());
    const tableCount = await child.locator("table").count();
    const controlCount = await child.locator("input, select, textarea, button, a").count();

    if (box && box.height >= 320 && text.length < 120 && tableCount === 0 && controlCount <= 1) {
      wastedSpaceReasons.push(`Sparse section ${index + 1} is ${Math.round(box.height)}px tall with little content.`);
    }
  }

  const dom: DomEvidence = {
    tableFound: tables.length > 0,
    rowCount: dataRows.length,
    filtersFound: filterControls.length >= 2,
    actionsFound,
    splitViewFound,
    splitViewSideBySide,
    previewSurfaceFound,
    previewActionsFound,
    importExportFound,
    rowClickableFound,
    guidanceCount,
    createTargets,
    qrInsideRegister,
    routeOwner,
    dataMode,
    workflowForm,
    workflowMarkers,
    inlineCreateMarkers,
    registerMarkers,
    realRegisterMarkers,
    fillerMatches,
    emptyStateTexts,
    wastedSpaceReasons,
    overflowIssues,
    duplicateTopLevelHeadings,
    duplicateHeaders,
    layoutIssues,
    deadLinkCandidates,
    sameOriginLinks,
    qrCandidates,
    visibleText: mainText,
  };

  const linkFindings = await probeLinks(context, baseUrl, route.path, dom.sameOriginLinks);

  page.off("response", responseListener);

  return {
    dom,
    apiCalls: uniqueApiCalls(apiCalls),
    apiCallTallies: tallyApiCalls(apiCalls),
    networkFailures: uniqueNetworkFailures(networkFailures),
    linkFindings,
  };
}

function tallyApiCalls(calls: NetworkCall[]) {
  const tallies = new Map<string, ApiCallTally>();

  calls.forEach((call) => {
    const key = `${call.method}:${call.url}`;
    const current = tallies.get(key);

    if (current) {
      current.count += 1;
      return;
    }

    tallies.set(key, {
      method: call.method,
      url: call.url,
      count: 1,
    });
  });

  return [...tallies.values()].filter((entry) => entry.count > 1);
}

function uniqueApiCalls(calls: NetworkCall[]) {
  const seen = new Set<string>();

  return calls.filter((call) => {
    const key = `${call.method}:${call.status}:${call.url}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function uniqueNetworkFailures(calls: NetworkFailure[]) {
  const seen = new Set<string>();

  return calls.filter((call) => {
    const key = `${call.method}:${call.status}:${call.url}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function probeLinks(
  context: BrowserContext,
  baseUrl: string,
  currentRoute: string,
  links: Array<{ text: string; href: string }>,
) {
  const candidates = links
    .filter((link) => link.href !== currentRoute)
    .filter((link) => !/^\/(login|workspace\/help)/.test(link.href))
    .slice(0, 2);

  const findings: string[] = [];

  for (const link of candidates) {
    const probe = await context.newPage();

    try {
      await probe.goto(`${baseUrl}${link.href}`, { waitUntil: "domcontentloaded" });
      await probe.waitForTimeout(500);

      const outcome = await probe.evaluate(() => {
        const text = (document.querySelector("main")?.textContent ?? document.body.textContent ?? "").replace(/\s+/g, " ").trim();
        return {
          isNotFound: /page not found|workspace page not found|this page is not available/i.test(text),
          isPlaceholder: /alerts and pending work|related workflow links/i.test(text),
        };
      });

      if (outcome.isNotFound) {
        findings.push(`Link "${link.text || link.href}" resolves to a not-found state at ${link.href}.`);
      } else if (outcome.isPlaceholder) {
        findings.push(`Link "${link.text || link.href}" resolves to a placeholder-style page at ${link.href}.`);
      }
    } catch (error) {
      findings.push(`Link "${link.text || link.href}" could not be verified: ${error instanceof Error ? error.message : String(error)}.`);
    } finally {
      await probe.close();
    }
  }

  return unique(findings);
}