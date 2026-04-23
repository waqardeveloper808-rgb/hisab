const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  await page.goto("http://localhost:3001/workspace/user/vat", { waitUntil: "networkidle" });
  await page.locator("#vat-from-date").fill("2026-04-15");
  await page.locator("#vat-to-date").fill("2026-04-15");
  await page.waitForTimeout(500);
  const receivedText = await page.locator('[data-inspector-vat-section="received"] .text-2xl').textContent();
  const paidText = await page.locator('[data-inspector-vat-section="paid"] .text-2xl').textContent();
  const payableText = await page.locator('[data-inspector-vat-section="payable"] .text-2xl').textContent();

  await page.goto("http://localhost:3001/workspace/user/stock", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add Inventory", exact: true }).click();
  await page.locator('#inventory-product').selectOption({ index: 0 });
  await page.locator('input').nth(0).fill('Copper Coil');
  await page.locator('input').nth(1).fill('Copper');
  await page.locator('input').nth(2).fill('10mm');
  await page.getByRole('button', { name: 'Next', exact: true }).first().click();
  await page.locator('#inventory-source').selectOption('production');
  await page.locator('input[type="number"]').nth(0).fill('60');
  await page.locator('input[type="number"]').nth(1).fill('20');
  await page.getByRole('button', { name: 'Next', exact: true }).first().click();
  await page.locator('input[type="date"]').fill('2026-04-17');
  await page.locator('input').last().fill('B20260417C');
  await page.getByRole('button', { name: 'Create inventory', exact: true }).click();
  await page.waitForTimeout(800);
  const stockRows = await page.locator('text=COPPER-COIL').count();

  console.log(JSON.stringify({
    vat: { receivedText, paidText, payableText },
    inventory: { createdCopperCoilRows: stockRows }
  }, null, 2));

  await browser.close();
})();
