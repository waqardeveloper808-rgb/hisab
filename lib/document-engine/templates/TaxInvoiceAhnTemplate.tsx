import type { TaxInvoiceAhnContract } from "@/lib/document-engine/contracts/taxInvoiceAhnContract";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency}`;
}

export function TaxInvoiceAhnTemplate({ contract }: { contract: TaxInvoiceAhnContract }) {
  const labels = {
    seller: contract.metadata.labels.seller || "Seller / البائع",
    customer: contract.metadata.labels.customer || "Customer / العميل",
    address: contract.metadata.labels.address || "Address / العنوان",
    vatNumber: contract.metadata.labels.vatNumber || "VAT Number / رقم التسجيل الضريبي",
    invoiceNumber: contract.metadata.labels.invoiceNumber || "Invoice Number / رقم الفاتورة",
    issueDate: contract.metadata.labels.issueDate || "Issue Date / التاريخ",
    dueDate: contract.metadata.labels.dueDate || "Due Date / تاريخ الاستحقاق",
    reference: contract.metadata.labels.reference || "Reference / المرجع",
    orderNumber: contract.metadata.labels.orderNumber || "Order Number / رقم الطلب",
    subtotal: contract.metadata.labels.subtotal || "Subtotal / المجموع الفرعي",
    vatTotal: contract.metadata.labels.vatTotal || "VAT Total / إجمالي ضريبة القيمة المضافة",
    grandTotal: contract.metadata.labels.grandTotal || "Total / المجموع شامل القيمة المضافة",
  };

  const linesHtml = contract.lines.map((line) => `
    <tr>
      <td>${line.lineNo}</td>
      <td>
        <div>${escapeHtml(line.descriptionEn)}</div>
        ${line.descriptionAr ? `<div class="ahn-ar" dir="rtl" lang="ar">${escapeHtml(line.descriptionAr)}</div>` : ""}
      </td>
      <td class="is-right">${line.qty}</td>
      <td class="is-right">${escapeHtml(money(line.unitPrice, contract.document.currency))}</td>
      <td class="is-right">${escapeHtml(money(line.taxableAmount, contract.document.currency))}</td>
      <td class="is-right">${escapeHtml(money(line.vatAmount, contract.document.currency))}</td>
      <td class="is-right">${escapeHtml(money(line.lineAmount, contract.document.currency))}</td>
    </tr>
  `).join("");

  const nationalAddress = contract.seller.nationalAddress;
  const nationalAddressLine = [
    nationalAddress?.buildingNumber,
    nationalAddress?.street,
    nationalAddress?.district,
    nationalAddress?.city,
    nationalAddress?.postalCode,
    nationalAddress?.additionalNumber,
    nationalAddress?.country,
  ].filter(Boolean).join(", ");

  return `
    <article class="ahn-tax-invoice" data-document-engine="tax-invoice-ahn" data-doc-root="true" data-zatca-qr-required="true" data-zatca-seller-vat-present="${contract.seller.vatNumber ? "true" : "false"}" data-zatca-seller-cr-present="${contract.seller.crNumber ? "true" : "false"}">
      <header class="ahn-header">
        <div class="ahn-seller-block">
          <div class="ahn-logo-wrap">${contract.seller.logoUrl ? `<img src="${escapeHtml(contract.seller.logoUrl)}" alt="Company logo" class="ahn-logo" />` : ""}</div>
          <div>
            <h1>${escapeHtml(contract.seller.companyNameEn)}</h1>
            <p class="ahn-ar" dir="rtl" lang="ar">${escapeHtml(contract.seller.companyNameAr)}</p>
            <p>${escapeHtml(contract.seller.addressEn)}</p>
            <p class="ahn-ar" dir="rtl" lang="ar">${escapeHtml(contract.seller.addressAr)}</p>
            ${nationalAddressLine ? `<p class="ahn-muted">National Address: ${escapeHtml(nationalAddressLine)}</p>` : ""}
            <p class="ahn-meta-line">Email: ${escapeHtml(contract.seller.email)} | VAT / الرقم الضريبي: ${escapeHtml(contract.seller.vatNumber)} | CR / السجل التجاري: ${escapeHtml(contract.seller.crNumber)}</p>
          </div>
        </div>
        <div class="ahn-title-row">
          <div class="ahn-title-ar" dir="rtl" lang="ar">فاتورة ضريبية</div>
          <div class="ahn-title-en">TAX INVOICE</div>
        </div>
      </header>

      <section class="ahn-meta-grid">
        <div><span>${escapeHtml(labels.customer)}</span><strong>${escapeHtml(contract.buyer.customerNameEnOrMain)}</strong>${contract.metadata.fieldVisibility.buyerArabicName && contract.buyer.customerNameAr ? `<div class="ahn-ar" dir="rtl" lang="ar">${escapeHtml(contract.buyer.customerNameAr)}</div>` : ""}</div>
        <div><span>${escapeHtml(labels.invoiceNumber)}</span><strong>${escapeHtml(contract.document.invoiceNumber)}</strong></div>
        ${contract.metadata.fieldVisibility.buyerAddress ? `<div><span>${escapeHtml(labels.address)}</span><strong>${escapeHtml(contract.buyer.addressEn || "-")}</strong>${contract.buyer.addressAr ? `<div class="ahn-ar" dir="rtl" lang="ar">${escapeHtml(contract.buyer.addressAr)}</div>` : ""}</div>` : ""}
        <div><span>${escapeHtml(labels.issueDate)}</span><strong>${escapeHtml(contract.document.issueDate)}</strong></div>
        ${contract.metadata.fieldVisibility.buyerVatNumber ? `<div><span>${escapeHtml(labels.vatNumber)}</span><strong>${escapeHtml(contract.buyer.vatNumber || "-")}</strong></div>` : ""}
        <div><span>${escapeHtml(labels.dueDate)}</span><strong>${escapeHtml(contract.document.dueDate)}</strong></div>
        ${contract.metadata.fieldVisibility.reference ? `<div><span>${escapeHtml(labels.reference)}</span><strong>${escapeHtml(contract.document.reference || "-")}</strong></div>` : ""}
        ${contract.metadata.fieldVisibility.orderNumber ? `<div><span>${escapeHtml(labels.orderNumber)}</span><strong>${escapeHtml(contract.document.orderNumber || "-")}</strong></div>` : ""}
      </section>

      <section>
        <table class="ahn-lines" data-line-items-table="true">
          <thead>
            <tr>
              <th>#</th>
              <th>Description / الوصف</th>
              <th class="is-right">Qty / الكمية</th>
              <th class="is-right">Price / السعر</th>
              <th class="is-right">Taxable amount / المبلغ الخاضع للضريبة</th>
              <th class="is-right">VAT amount / القيمة المضافة</th>
              <th class="is-right">Line amount / المجموع</th>
            </tr>
          </thead>
          <tbody>${linesHtml}</tbody>
        </table>
      </section>

      <section class="ahn-qrcode-note">
        <p>${escapeHtml(contract.metadata.zatcaQrNote)}</p>
        <p class="ahn-muted">QR Data Hook: ${escapeHtml(contract.document.qrCodeData)}</p>
      </section>

      <section class="ahn-totals" data-totals-box="true">
        <div><span>${escapeHtml(labels.subtotal)}</span><strong>${escapeHtml(money(contract.totals.subtotal, contract.document.currency))}</strong></div>
        <div><span>${escapeHtml(labels.vatTotal)}</span><strong>${escapeHtml(money(contract.totals.vatTotal, contract.document.currency))}</strong></div>
        <div class="ahn-grand"><span>${escapeHtml(labels.grandTotal)}</span><strong>${escapeHtml(money(contract.totals.grandTotal, contract.document.currency))}</strong></div>
      </section>

      ${contract.metadata.fieldVisibility.notes && contract.metadata.notes ? `<section class="ahn-notes"><p>${escapeHtml(contract.metadata.notes)}</p></section>` : ""}

      <footer class="ahn-footer">
        <div>${escapeHtml(contract.metadata.complianceFooter)}</div>
        <div class="ahn-footer-assets">
          ${contract.metadata.fieldVisibility.stamp && contract.metadata.stampUrl ? `<img src="${escapeHtml(contract.metadata.stampUrl)}" alt="Stamp" class="ahn-stamp" />` : ""}
          ${contract.metadata.fieldVisibility.signature && contract.metadata.signatureUrl ? `<img src="${escapeHtml(contract.metadata.signatureUrl)}" alt="Signature" class="ahn-signature" />` : ""}
        </div>
        <div>Page ${contract.document.pageNumber} of ${contract.document.totalPages}</div>
      </footer>
    </article>
  `;
}
