import path from "node:path";
import { chromium } from "playwright";
import { appendExecutionLog, writeJson, writeText } from "./audit-artifact-writer.mjs";

function buildMarkdown(result) {
  return [
    "# UI Audit Results",
    "",
    `- status: ${result.status}`,
    `- page_reachable: ${result.pageReachable ? "yes" : "no"}`,
    `- summary_visible: ${result.summaryVisible ? "yes" : "no"}`,
    `- inline_expand_worked: ${result.inlineExpandWorked ? "yes" : "no"}`,
    `- fallback_used: ${result.fallbackUsed ? "yes" : "no"}`,
    `- retries: ${result.retries}`,
    "",
    "## Blockers",
    ...(result.blockers.length ? result.blockers.map((blocker) => `- ${blocker.step}: ${blocker.message}`) : ["- none"]),
    "",
  ].join("\n") + "\n";
}

async function tryExpandSystemTree(page, screenshotPath, simulateMissingSelector) {
  const blockers = [];
  let inlineExpandWorked = false;
  let summaryText = "";
  let fallbackUsed = false;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    if (attempt > 1) {
      fallbackUsed = true;
      await page.reload({ waitUntil: "networkidle", timeout: 45000 });
    }

    await page.locator('[data-inspector-system-master-design="tree"]').waitFor({ state: "visible", timeout: 20000 });

    const toggle = page.locator('[data-inspector-system-tree-toggle]').first();
    if (!simulateMissingSelector && await toggle.count()) {
      await toggle.click();
      await page.waitForTimeout(250);
      const childContainer = page.locator('[data-inspector-system-tree-children]').first();
      if (await childContainer.count()) {
        inlineExpandWorked = true;
        summaryText = (await page.locator('[data-inspector-system-master-design-summary="true"]').textContent())?.trim() ?? "";
        await page.screenshot({ path: screenshotPath, fullPage: true });
        return { inlineExpandWorked, summaryText, blockers, fallbackUsed, retries: attempt - 1 };
      }
      blockers.push({
        step: "inline-expand",
        message: `Attempt ${attempt}: system tree did not expose child modules inline after toggle.`,
      });
    } else {
      blockers.push({
        step: "tree-toggle-selector",
        message: `Attempt ${attempt}: selector [data-inspector-system-tree-toggle] was not available.`,
      });
    }
  }

  return { inlineExpandWorked, summaryText, blockers, fallbackUsed, retries: 1 };
}

export async function collectUiAuditOptional({ artifactDir, baseUrl, simulateMissingSelector = false }) {
  const startedAt = new Date().toISOString();
  await appendExecutionLog(artifactDir, `- stage_ui_collect_start: ${startedAt}`);
  const screenshotPath = path.join(artifactDir, "screenshots", "ui-audit-master-design.png");
  const result = {
    collector: "ui",
    status: "partial",
    pageReachable: false,
    summaryVisible: false,
    inlineExpandWorked: false,
    fallbackUsed: false,
    retries: 0,
    summaryText: "",
    blockers: [],
    startedAt,
    endedAt: null,
    error: null,
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1400 } });

  try {
    await page.goto(`${baseUrl}/system/master-design`, { waitUntil: "networkidle", timeout: 45000 });
    await page.locator('[data-inspector-system-master-design="tree"]').waitFor({ state: "visible", timeout: 20000 });
    result.pageReachable = true;

    result.summaryVisible = (await page.locator('[data-inspector-system-master-design-summary="true"]').count()) > 0;

    const openResult = await tryExpandSystemTree(page, screenshotPath, simulateMissingSelector);
    result.inlineExpandWorked = openResult.inlineExpandWorked;
    result.summaryText = openResult.summaryText;
    result.fallbackUsed = openResult.fallbackUsed;
    result.retries = openResult.retries;
    result.blockers = openResult.blockers;

    if (result.pageReachable && result.summaryVisible && result.inlineExpandWorked && /214/.test(result.summaryText)) {
      result.status = "pass";
    } else if (result.pageReachable) {
      result.status = "partial";
    } else {
      result.status = "fail";
    }
  } catch (error) {
    result.status = "fail";
    result.error = error instanceof Error ? error.message : String(error);
    result.blockers.push({ step: "ui-collector", message: result.error });
  } finally {
    result.endedAt = new Date().toISOString();
    await browser.close();
  }

  await writeJson(path.join(artifactDir, "ui-audit-results.json"), result);
  await writeText(path.join(artifactDir, "ui-audit-results.md"), buildMarkdown(result));
  await writeJson(path.join(artifactDir, "ui-audit-blockers.json"), {
    generatedAt: new Date().toISOString(),
    simulateMissingSelector,
    blockers: result.blockers,
  });
  await appendExecutionLog(artifactDir, `- stage_ui_collect_end: ${result.endedAt}`);
  return result;
}