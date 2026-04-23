import type { TaxInvoiceSaudiStandardContract } from "@/lib/document-engine/contracts/taxInvoiceSaudiStandardContract";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} ${currency}`;
}

function qrImageUrl(data: string) {
  return `https://quickchart.io/qr?size=220&text=${encodeURIComponent(data)}`;
}

function metaCell(labelEn: string, labelAr: string, value: string) {
  return `
    <div class="saudi-meta-cell">
      <div class="saudi-meta-label">${escapeHtml(labelEn)}</div>
      <div class="saudi-meta-label saudi-ar">${escapeHtml(labelAr)}</div>
      <div class="saudi-meta-value">${escapeHtml(value || "-")}</div>
    </div>
  `;
}

export function TaxInvoiceSaudiStandard({
  contract,
}: {
  contract: TaxInvoiceSaudiStandardContract;
}) {
  const linesHtml = contract.lines
    .map(
      (line) => `
      <tr>
        <td class="saudi-center">${line.lineNo}</td>
        <td>
          <div class="saudi-line-en">${escapeHtml(line.descriptionEn)}</div>
          ${line.descriptionAr ? `<div class="saudi-line-ar saudi-ar">${escapeHtml(line.descriptionAr)}</div>` : ""}
        </td>
        <td class="saudi-right">${escapeHtml(String(line.qty))}</td>
        <td class="saudi-right">${escapeHtml(money(line.unitPrice, contract.document.currency))}</td>
        <td class="saudi-right">${escapeHtml(money(line.taxableAmount, contract.document.currency))}</td>
        <td class="saudi-right">
          <div>${escapeHtml(money(line.vatAmount, contract.document.currency))}</div>
          <div class="saudi-vat-rate">${escapeHtml(`${line.vatRate.toFixed(0)}%`)}</div>
        </td>
        <td class="saudi-right saudi-strong">${escapeHtml(money(line.lineAmount, contract.document.currency))}</td>
      </tr>
    `,
    )
    .join("");

  const buyerAddressBlock = contract.editor.fieldVisibility.buyerAddress
    ? metaCell("Address", "العنوان", contract.buyer.addressEn)
    : "";

  const buyerVatBlock = contract.editor.fieldVisibility.buyerVatNumber
    ? metaCell("VAT number", "رقم التسجيل الضريبي", contract.buyer.vatNumber)
    : "";

  const referenceBlock = contract.editor.fieldVisibility.reference
    ? metaCell("Reference", "المرجع", contract.document.reference)
    : "";

  const orderBlock = contract.editor.fieldVisibility.orderNumber
    ? metaCell("Order number", "رقم الطلب", contract.document.orderNumber)
    : "";

  const supplyDateBlock = contract.editor.fieldVisibility.supplyDate
    ? metaCell("Supply date", "تاريخ التوريد", contract.document.supplyDate)
    : "";

  const nationalAddressBlock = contract.editor.fieldVisibility.nationalAddress
    ? `
      <div class="saudi-seller-national-address">
        <div>National Address: ${escapeHtml(contract.seller.nationalAddressLineEn)}</div>
        <div class="saudi-ar">${escapeHtml(contract.seller.nationalAddressLineAr)}</div>
      </div>
    `
    : "";

  return `
    <article
      class="saudi-tax-invoice"
      data-document-engine="tax-invoice-saudi-standard"
      data-doc-root="true"
      data-template-kind="tax_invoice"
      data-zatca-phase2-hook="${escapeHtml(contract.compliance.zatcaPhase2Hook)}"
      data-xml-hook="${escapeHtml(contract.compliance.xmlHook)}"
      data-pdf-standard-hook="${escapeHtml(contract.compliance.pdfStandardHook)}"
      data-template-editor-logo-upload="${contract.editor.logoUpload ? "true" : "false"}"
      data-template-editor-stamp-upload="${contract.editor.stampUpload ? "true" : "false"}"
      data-template-editor-signature-upload="${contract.editor.signatureUpload ? "true" : "false"}"
    >
      <header class="saudi-header">
        <div class="saudi-header-grid">
          <div class="saudi-seller-block">
            <div class="saudi-logo-wrap">
              ${contract.seller.logoUrl ? `<img src="${escapeHtml(contract.seller.logoUrl)}" alt="Company logo" class="saudi-logo" />` : `<div class="saudi-logo-placeholder"></div>`}
            </div>

            <div class="saudi-seller-details">
              <div class="saudi-company-name-en">${escapeHtml(contract.seller.companyNameEn)}</div>
              <div class="saudi-company-name-ar saudi-ar">${escapeHtml(contract.seller.companyNameAr)}</div>

              <div class="saudi-seller-address-en">${escapeHtml(contract.seller.addressEn)}</div>
              <div class="saudi-seller-address-ar saudi-ar">${escapeHtml(contract.seller.addressAr)}</div>

              <div class="saudi-seller-contact">${escapeHtml(contract.seller.email)}</div>
              <div class="saudi-seller-ids">
                <span>VAT number ${escapeHtml(contract.seller.vatNumber)}</span>
                <span>CR Number ${escapeHtml(contract.seller.crNumber)}</span>
              </div>
              <div class="saudi-seller-ids saudi-ar">
                <span>رقم التسجيل الضريبي ${escapeHtml(contract.seller.vatNumber)}</span>
                <span>رقم السجل التجاري ${escapeHtml(contract.seller.crNumber)}</span>
              </div>

              ${nationalAddressBlock}
            </div>
          </div>

          <div class="saudi-title-block">
            <div class="saudi-title-ar saudi-ar">فاتورة ضريبية</div>
            <div class="saudi-title-en">Invoice Tax</div>
          </div>
        </div>
      </header>

      <section class="saudi-meta-grid">
        ${metaCell("Customer", "العميل", contract.buyer.customerName)}
        ${metaCell("Invoice number", "رقم الفاتورة", contract.document.invoiceNumber)}
        ${buyerAddressBlock}
        ${metaCell("Date", "التاريخ", contract.document.issueDate)}
        ${buyerVatBlock}
        ${metaCell("Due date", "تاريخ الاستحقاق", contract.document.dueDate)}
        ${referenceBlock}
        ${orderBlock}
        ${supplyDateBlock}
      </section>

      <section class="saudi-lines-section">
        <table class="saudi-lines" data-line-items-table="true">
          <thead>
            <tr>
              <th>#</th>
              <th>
                <div>Description</div>
                <div class="saudi-ar">الوصف</div>
              </th>
              <th class="saudi-right">
                <div>Qty</div>
                <div class="saudi-ar">الكمية</div>
              </th>
              <th class="saudi-right">
                <div>Price</div>
                <div class="saudi-ar">السعر</div>
              </th>
              <th class="saudi-right">
                <div>Taxable amount</div>
                <div class="saudi-ar">المبلغ الخاضع للضريبة</div>
              </th>
              <th class="saudi-right">
                <div>VAT amount</div>
                <div class="saudi-ar">القيمة المضافة</div>
              </th>
              <th class="saudi-right">
                <div>Line amount</div>
                <div class="saudi-ar">المجموع</div>
              </th>
            </tr>
          </thead>
          <tbody>${linesHtml}</tbody>
        </table>
      </section>

      <section class="saudi-qr-and-totals">
        <div class="saudi-qr-block" data-zatca-qr-required="true">
          <img class="saudi-qr-img" src="${escapeHtml(qrImageUrl(contract.document.qrCodeData))}" alt="Invoice QR" />
          <div class="saudi-qr-note">
            <div>${escapeHtml(contract.compliance.qrComplianceNoteEn)}</div>
            <div class="saudi-ar">${escapeHtml(contract.compliance.qrComplianceNoteAr)}</div>
          </div>
        </div>

        <div class="saudi-totals" data-totals-box="true">
          <div class="saudi-totals-row">
            <span>Subtotal</span>
            <span class="saudi-ar">المجموع الفرعي</span>
            <strong>${escapeHtml(money(contract.totals.subtotal, contract.document.currency))}</strong>
          </div>
          <div class="saudi-totals-row">
            <span>VAT Total</span>
            <span class="saudi-ar">إجمالي ضريبة القيمة المضافة</span>
            <strong>${escapeHtml(money(contract.totals.vatTotal, contract.document.currency))}</strong>
          </div>
          <div class="saudi-totals-row saudi-totals-grand">
            <span>Total</span>
            <span class="saudi-ar">المجموع شامل القيمة المضافة</span>
            <strong>${escapeHtml(money(contract.totals.grandTotal, contract.document.currency))}</strong>
          </div>
        </div>
      </section>

      <footer class="saudi-footer">
        <div class="saudi-footer-top">
          <span>${escapeHtml(contract.seller.companyNameEn)}</span>
          <span class="saudi-ar">${escapeHtml(contract.seller.companyNameAr)}</span>
        </div>

        <div class="saudi-footer-assets">
          ${
            contract.editor.fieldVisibility.stamp && contract.editor.stampUrl
              ? `<img src="${escapeHtml(contract.editor.stampUrl)}" alt="Stamp" class="saudi-stamp" />`
              : ""
          }
          ${
            contract.editor.fieldVisibility.signature && contract.editor.signatureUrl
              ? `<img src="${escapeHtml(contract.editor.signatureUrl)}" alt="Signature" class="saudi-signature" />`
              : ""
          }
        </div>

        <div class="saudi-footer-page">
          Page ${contract.document.pageNumber} of ${contract.document.totalPages}
        </div>
      </footer>
    </article>
  `;
}
