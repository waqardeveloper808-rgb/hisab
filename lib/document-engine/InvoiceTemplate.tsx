import type { DocumentRenderModel } from "@/lib/document-engine/types";

const formatCurrency = new Intl.NumberFormat("en-SA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value: number, currencyCode: string) {
  return `${formatCurrency.format(value)} ${currencyCode}`;
}

function formatBusinessDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString + "T00:00:00");
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-SA", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return dateString;
  }
}

export function InvoiceTemplate({ model }: { model: DocumentRenderModel }) {
  const companyNameEn = model.company.englishName || model.company.tradeName || model.company.legalName || "-";
  const companyNameAr = model.company.arabicName || model.company.legalName || "-";
  const lineVatLabel = `${model.invoice.vatRate.toFixed(0)}%`;
  const lineVatHeader = model.document.showVatColumn ? `<th class="gh-th-vat">VAT</th>` : "";
  
  const linesHtml = model.invoice.lines.map((line) => `
    <tr>
      <td class="gh-td-seq">${line.sequence}</td>
      <td class="gh-td-desc">
        <div class="gh-line-description">${escapeHtml(line.description)}</div>
        ${line.descriptionAr ? `<div class="gh-line-description-ar" dir="rtl" lang="ar">${escapeHtml(line.descriptionAr)}</div>` : ""}
      </td>
      <td class="gh-td-qty">${escapeHtml(formatCurrency.format(line.quantity))}</td>
      <td class="gh-td-price">${escapeHtml(money(line.unitPrice, model.invoice.currency))}</td>
      ${model.document.showVatColumn ? `<td class="gh-td-vat">${escapeHtml(line.vatLabel || lineVatLabel)}</td>` : ""}
      <td class="gh-td-total">${escapeHtml(money(line.total, model.invoice.currency))}</td>
    </tr>`).join("");

  const referenceMarkup = model.document.referenceValue
    ? `<div class="gh-meta-row"><span class="gh-meta-label">${escapeHtml(model.document.referenceLabelEn || "Reference")}</span><span class="gh-meta-value">${escapeHtml(model.document.referenceValue)}</span></div>`
    : "";

  return `
    <article
      class="gh-document-root"
      data-document-engine="invoice-template"
      data-company-logo-present="${model.company.logoUrl ? "true" : "false"}"
      data-document-kind="${escapeHtml(model.document.kind)}"
      data-doc-root="true"
      data-zatca-qr-required="${model.document.showQr ? "true" : "false"}"
      data-zatca-seller-vat-present="${model.company.vatNumber ? "true" : "false"}"
      data-zatca-seller-cr-present="${model.company.crNumber ? "true" : "false"}"
    >
      <!-- HEADER: Logo + Company Name + Title -->
      <header class="gh-header">
        <div class="gh-header-left">
          <div class="gh-logo-zone">
            ${model.company.logoUrl ? `<img src="${escapeHtml(model.company.logoUrl)}" alt="${escapeHtml(companyNameEn)} logo" class="gh-logo-image" />` : `<div class="gh-logo-empty"></div>`}
          </div>
          <div class="gh-company-info">
            <h1 class="gh-company-name-en">${escapeHtml(companyNameEn)}</h1>
            <div class="gh-company-name-ar" dir="rtl" lang="ar">${escapeHtml(companyNameAr)}</div>
            <div class="gh-company-ids">
              ${model.company.vatNumber ? `<span>VAT: ${escapeHtml(model.company.vatNumber)}</span>` : ""}
              ${model.company.crNumber ? `<span>CR: ${escapeHtml(model.company.crNumber)}</span>` : ""}
            </div>
          </div>
        </div>
        <div class="gh-title-zone">
          <div class="gh-title-en">${escapeHtml(model.document.titleEn)}</div>
          <div class="gh-title-ar" dir="rtl" lang="ar">${escapeHtml(model.document.titleAr)}</div>
        </div>
      </header>

      <!-- DOCUMENT METADATA -->
      <section class="gh-metadata-section">
        <div class="gh-metadata-grid">
          <div class="gh-meta-row">
            <span class="gh-meta-label">${escapeHtml(model.document.numberLabelEn)}</span>
            <span class="gh-meta-value">${escapeHtml(model.invoice.number)}</span>
          </div>
          <div class="gh-meta-row">
            <span class="gh-meta-label">Issue Date</span>
            <span class="gh-meta-value">${formatBusinessDate(model.invoice.issueDate)}</span>
          </div>
          <div class="gh-meta-row">
            <span class="gh-meta-label">Supply Date</span>
            <span class="gh-meta-value">${formatBusinessDate(model.invoice.supplyDate)}</span>
          </div>
          <div class="gh-meta-row">
            <span class="gh-meta-label">Due Date</span>
            <span class="gh-meta-value">${formatBusinessDate(model.invoice.dueDate)}</span>
          </div>
          <div class="gh-meta-row">
            <span class="gh-meta-label">Currency</span>
            <span class="gh-meta-value">${escapeHtml(model.invoice.currency)}</span>
          </div>
          ${referenceMarkup}
        </div>
      </section>

      <!-- CUSTOMER INFORMATION -->
      <section class="gh-customer-section">
        <h2 class="gh-section-title">${escapeHtml(model.document.partyLabelEn)}</h2>
        <div class="gh-customer-grid">
          <div class="gh-meta-row">
            <span class="gh-meta-label">${escapeHtml(model.document.partyLabelEn)} Name</span>
            <span class="gh-meta-value">${escapeHtml(model.customer.name)}</span>
          </div>
          <div class="gh-meta-row">
            <span class="gh-meta-label">Address</span>
            <span class="gh-meta-value">${escapeHtml(model.customer.address)}</span>
          </div>
          <div class="gh-meta-row">
            <span class="gh-meta-label">VAT Number</span>
            <span class="gh-meta-value">${escapeHtml(model.customer.vatNumber)}</span>
          </div>
          <div class="gh-meta-row">
            <span class="gh-meta-label">Contact</span>
            <span class="gh-meta-value">${escapeHtml(model.customer.contact)}</span>
          </div>
        </div>
      </section>

      <!-- LINE ITEMS TABLE (FULL WIDTH) -->
      <section class="gh-lines-section">
        <table class="gh-line-table" data-line-items-table="true">
          <thead>
            <tr>
              <th class="gh-th-seq">#</th>
              <th class="gh-th-desc">Description</th>
              <th class="gh-th-qty">Qty</th>
              <th class="gh-th-price">Unit Price</th>
              ${lineVatHeader}
              <th class="gh-th-total">Total</th>
            </tr>
          </thead>
          <tbody>${linesHtml}</tbody>
        </table>
      </section>

      <!-- TOTALS SECTION -->
      <section class="gh-totals-section">
        <div class="gh-totals-box">
          <div class="gh-total-row">
            <span class="gh-total-label">Subtotal</span>
            <span class="gh-total-value">${escapeHtml(money(model.invoice.subtotal, model.invoice.currency))}</span>
          </div>
          ${model.document.showVatTotals ? `<div class="gh-total-row">
            <span class="gh-total-label">VAT</span>
            <span class="gh-total-value">${escapeHtml(money(model.invoice.vatTotal, model.invoice.currency))}</span>
          </div>` : ""}
          <div class="gh-total-row gh-total-grand">
            <span class="gh-total-label">Grand Total</span>
            <span class="gh-total-value">${escapeHtml(money(model.invoice.grandTotal, model.invoice.currency))}</span>
          </div>
        </div>
      </section>

      <!-- FOOTER: Company Details -->
      <footer class="gh-footer">
        <div class="gh-footer-content">
          ${model.company.addressEn ? `<div class="gh-footer-line">${escapeHtml(model.company.addressEn)}</div>` : ""}
          <div class="gh-footer-line">
            ${model.company.email ? `<span>${escapeHtml(model.company.email)}</span>` : ""}
            ${model.company.phone ? `<span>${escapeHtml(model.company.phone)}</span>` : ""}
          </div>
        </div>
      </footer>
    </article>`;
}