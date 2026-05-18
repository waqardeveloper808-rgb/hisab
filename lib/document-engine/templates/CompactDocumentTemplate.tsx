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

function qrImageSrc(zatca: { qrPayload: string; qrImageDataUrl?: string }): string {
  const dataUrl = zatca.qrImageDataUrl?.trim();
  if (dataUrl?.startsWith("data:")) return dataUrl;
  return "";
}

function formatBusinessDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString.includes("T") ? dateString : `${dateString}T12:00:00`);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-SA", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return dateString;
  }
}

function formatDiscountCell(amount: number, currency: string): string {
  if (!amount || amount === 0) return "—";
  return money(amount, currency);
}

function meaningfulText(value: string | null | undefined): boolean {
  const t = (value ?? "").trim();
  return t.length > 0 && t !== "—";
}

function metaPanelCell(labelEn: string, labelAr: string, value: string) {
  return `<div class="cd-mp-cell" role="group">
    <div class="cd-mp-label-row">
      <span class="cd-mp-le">${escapeHtml(labelEn)}</span>
      <span class="cd-mp-la" dir="rtl" lang="ar">${escapeHtml(labelAr)}</span>
    </div>
    <div class="cd-mp-value">${escapeHtml(value)}</div>
  </div>`;
}

export function CompactDocumentTemplate({ model }: { model: DocumentRenderModel }) {
  const companyNameEn = model.company.englishName || model.company.tradeName || model.company.legalName || "—";
  const companyNameAr = model.company.arabicName || model.company.legalName || "—";
  const logoSrc = escapeHtml(model.company.logoUrl?.trim() || model.company.defaultBrandLogoPath);
  const lineVatLabel = `${model.invoice.vatRate.toFixed(0)}%`;

  const showVatTotals = model.document.showVatTotals;
  const showAnyVatCols = model.document.showVatColumn && showVatTotals;
  const showVatPercentCol = Boolean(showAnyVatCols && model.document.showVatPercentColumn);
  const showUnitCol = model.document.showUnitColumn;

  const notesRaw = (model.notes ?? "").trim();
  const notesBlock =
    notesRaw.length > 0
      ? `<section class="cd-notes" data-notes-section="true"><div class="cd-notes-inner">${escapeHtml(notesRaw)}</div></section>`
      : "";

  const subtitleBadgeBlock =
    model.document.subtitleBadgeEn.trim() || model.document.subtitleBadgeAr.trim()
      ? `<div class="cd-badge-pill"><span class="cd-badge-en">${escapeHtml(model.document.subtitleBadgeEn)}</span><span class="cd-badge-sep">/</span><span class="cd-badge-ar" dir="rtl" lang="ar">${escapeHtml(model.document.subtitleBadgeAr)}</span></div>`
      : "";

  const sellerVat = (model.company.vatNumber ?? "").trim();
  const metaCells: string[] = [
    metaPanelCell(model.document.numberLabelEn, model.document.numberLabelAr, model.invoice.number),
  ];
  if (sellerVat) {
    metaCells.push(metaPanelCell("Seller VAT", "الرقم الضريبي للبائع", sellerVat));
  }
  metaCells.push(
    metaPanelCell("Issue Date", "تاريخ الإصدار", formatBusinessDate(model.invoice.issueDate)),
    metaPanelCell("Supply Date", "تاريخ التوريد", formatBusinessDate(model.invoice.supplyDate)),
    metaPanelCell("Currency", "العملة", model.invoice.currency),
  );
  if (model.invoice.issueTime?.trim()) {
    metaCells.push(metaPanelCell("Time", "الوقت", model.invoice.issueTime.trim()));
  }
  if (model.document.referenceValue && model.document.referenceLabelEn) {
    metaCells.push(
      metaPanelCell(
        model.document.referenceLabelEn,
        model.document.referenceLabelAr ?? "",
        model.document.referenceValue,
      ),
    );
  }

  const metaSection = `<section class="cd-doc-meta-panel" aria-label="Document metadata">
    <div class="cd-meta-panel-heading">
      <span class="cd-meta-panel-heading-en">Document details</span>
      <span class="cd-meta-panel-heading-ar" dir="rtl" lang="ar">بيانات المستند</span>
    </div>
    <div class="cd-meta-panel-grid">${metaCells.join("")}</div>
  </section>`;

  const theadCells: string[] = [
    `<th class="cd-th cd-th-seq">#</th>`,
    `<th class="cd-th cd-th-desc"><span class="cd-th-en">Description</span><span class="cd-th-ar" dir="rtl" lang="ar">الوصف</span></th>`,
    `<th class="cd-th cd-th-qty"><span class="cd-th-en">Qty</span><span class="cd-th-ar" dir="rtl" lang="ar">الكمية</span></th>`,
  ];
  if (showUnitCol) {
    theadCells.push(
      `<th class="cd-th cd-th-unit"><span class="cd-th-en">Unit</span><span class="cd-th-ar" dir="rtl" lang="ar">الوحدة</span></th>`,
    );
  }
  theadCells.push(
    `<th class="cd-th cd-th-price"><span class="cd-th-en">Unit Price</span><span class="cd-th-ar" dir="rtl" lang="ar">سعر الوحدة</span></th>`,
    `<th class="cd-th cd-th-disc"><span class="cd-th-en">Discount</span><span class="cd-th-ar" dir="rtl" lang="ar">الخصم</span></th>`,
  );
  if (showAnyVatCols) {
    theadCells.push(
      `<th class="cd-th cd-th-taxable"><span class="cd-th-en">Taxable</span><span class="cd-th-ar" dir="rtl" lang="ar">الخاضع</span></th>`,
    );
    if (showVatPercentCol) {
      theadCells.push(
        `<th class="cd-th cd-th-vatpct"><span class="cd-th-en">VAT %</span><span class="cd-th-ar" dir="rtl" lang="ar">ضريبة %</span></th>`,
      );
    }
    theadCells.push(
      `<th class="cd-th cd-th-vatamt"><span class="cd-th-en">VAT</span><span class="cd-th-ar" dir="rtl" lang="ar">الضريبة</span></th>`,
    );
  }
  theadCells.push(
    `<th class="cd-th cd-th-total"><span class="cd-th-en">Total</span><span class="cd-th-ar" dir="rtl" lang="ar">المجموع</span></th>`,
  );

  const linesHtml = model.invoice.lines
    .map((line) => {
      const taxable = line.taxableAmount ?? line.quantity * line.unitPrice;
      const vatAmt = line.vatAmount ?? 0;
      const cells: string[] = [
        `<td class="cd-td cd-td-seq">${line.sequence}</td>`,
        `<td class="cd-td cd-td-desc"><div class="cd-line-en">${escapeHtml(line.description)}</div>${line.descriptionAr ? `<div class="cd-line-ar" dir="rtl" lang="ar">${escapeHtml(line.descriptionAr)}</div>` : ""}</td>`,
        `<td class="cd-td cd-td-qty">${escapeHtml(formatCurrency.format(line.quantity))}</td>`,
      ];
      if (showUnitCol) {
        const u = line.unitLabel?.trim();
        cells.push(`<td class="cd-td cd-td-unit">${u ? escapeHtml(u) : "—"}</td>`);
      }
      cells.push(
        `<td class="cd-td cd-td-price">${escapeHtml(money(line.unitPrice, model.invoice.currency))}</td>`,
        `<td class="cd-td cd-td-disc">${escapeHtml(formatDiscountCell(line.discountAmount, model.invoice.currency))}</td>`,
      );
      if (showAnyVatCols) {
        cells.push(`<td class="cd-td cd-td-taxable">${escapeHtml(money(taxable, model.invoice.currency))}</td>`);
        if (showVatPercentCol) {
          cells.push(`<td class="cd-td cd-td-vatpct">${escapeHtml(line.vatLabel || lineVatLabel)}</td>`);
        }
        cells.push(`<td class="cd-td cd-td-vatamt">${escapeHtml(money(vatAmt, model.invoice.currency))}</td>`);
      }
      cells.push(`<td class="cd-td cd-td-total">${escapeHtml(money(line.total, model.invoice.currency))}</td>`);
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  const customerGridInner = [
    meaningfulText(model.customer.name) || meaningfulText(model.customer.nameAr)
      ? `<div class="cd-cust-row">
            <div class="cd-cust-cell cd-cust-en"><span class="cd-cust-k">Name</span><span class="cd-cust-v">${escapeHtml(model.customer.name)}</span></div>
            <div class="cd-cust-cell cd-cust-ar" dir="rtl" lang="ar"><span class="cd-cust-k">الاسم</span><span class="cd-cust-v">${escapeHtml(meaningfulText(model.customer.nameAr) ? model.customer.nameAr : model.customer.name)}</span></div>
          </div>`
      : "",
    meaningfulText(model.customer.address) || meaningfulText(model.customer.addressAr)
      ? `<div class="cd-cust-row">
            <div class="cd-cust-cell cd-cust-en"><span class="cd-cust-k">Address</span><span class="cd-cust-v">${escapeHtml(model.customer.address)}</span></div>
            <div class="cd-cust-cell cd-cust-ar" dir="rtl" lang="ar"><span class="cd-cust-k">العنوان</span><span class="cd-cust-v">${escapeHtml(meaningfulText(model.customer.addressAr) ? model.customer.addressAr : model.customer.address)}</span></div>
          </div>`
      : "",
    meaningfulText(model.customer.vatNumber)
      ? `<div class="cd-cust-row">
            <div class="cd-cust-cell cd-cust-en"><span class="cd-cust-k">VAT Number</span><span class="cd-cust-v">${escapeHtml(model.customer.vatNumber)}</span></div>
            <div class="cd-cust-cell cd-cust-ar" dir="rtl" lang="ar"><span class="cd-cust-k">الرقم الضريبي</span><span class="cd-cust-v">${escapeHtml(model.customer.vatNumber)}</span></div>
          </div>`
      : "",
    meaningfulText(model.customer.contact)
      ? `<div class="cd-cust-row">
            <div class="cd-cust-cell cd-cust-en"><span class="cd-cust-k">Contact</span><span class="cd-cust-v">${escapeHtml(model.customer.contact)}</span></div>
            <div class="cd-cust-cell cd-cust-ar" dir="rtl" lang="ar"><span class="cd-cust-k">جهة الاتصال</span><span class="cd-cust-v">${escapeHtml(model.customer.contact)}</span></div>
          </div>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const customerSection = customerGridInner.trim()
    ? `<section class="cd-customer-card">
        <div class="cd-customer-head">
          <span class="cd-customer-en">${escapeHtml(model.document.partyLabelEn)}</span>
          <span class="cd-customer-ar" dir="rtl" lang="ar">${escapeHtml(model.document.partyLabelAr)}</span>
        </div>
        <div class="cd-customer-grid">${customerGridInner}</div>
      </section>`
    : "";

  const aw = model.amountInWords;
  const amountWordsBlock =
    aw && (aw.en.trim() || aw.ar.trim())
      ? `<section class="cd-amount-words" data-amount-in-words="true">
        <div class="cd-amount-words-head">Amount in words / المبلغ كتابةً</div>
        ${aw.en.trim() ? `<div>${escapeHtml(aw.en)}</div>` : ""}
        ${aw.ar.trim() ? `<div class="cd-amount-words-ar" dir="rtl" lang="ar">${escapeHtml(aw.ar)}</div>` : ""}
      </section>`
      : "";

  const footerNote = model.footerNote;
  const footerBlock =
    footerNote && (footerNote.en.trim() || footerNote.ar.trim())
      ? `<footer class="cd-doc-footer">
        ${footerNote.en.trim() ? `<div>${escapeHtml(footerNote.en)}</div>` : ""}
        ${footerNote.ar.trim() ? `<div class="cd-doc-footer-ar" dir="rtl" lang="ar">${escapeHtml(footerNote.ar)}</div>` : ""}
      </footer>`
      : "";

  const zatca = model.zatca;
  const zatcaBlock =
    zatca?.enabled
      ? `<section class="cd-zatca-card" data-zatca-module="on" aria-label="ZATCA">
        <div class="cd-zatca-card-head">
          <span>ZATCA e-Invoice</span>
          <span dir="rtl" lang="ar">الفاتورة الإلكترونية — هيئة الزكاة والضريبة والجمارك</span>
        </div>
        <div class="cd-zatca-card-body">
          <div class="cd-zatca-qr-wrap">
            <img class="cd-zatca-qr-img" src="${escapeHtml(qrImageSrc(zatca))}" alt="ZATCA Phase 1 QR" width="96" height="96" data-qrcode-source="local" />
          </div>
          <div class="cd-zatca-fields">
            ${zatca.uuid ? `<div class="cd-zatca-row"><span class="cd-zatca-k">UUID</span><span class="cd-zatca-v">${escapeHtml(zatca.uuid)}</span></div>` : ""}
            ${zatca.invoiceHash ? `<div class="cd-zatca-row"><span class="cd-zatca-k">Invoice Hash</span><span class="cd-zatca-v cd-zatca-mono">${escapeHtml(zatca.invoiceHash)}</span></div>` : ""}
            ${zatca.previousInvoiceHash ? `<div class="cd-zatca-row"><span class="cd-zatca-k">Previous Invoice Hash</span><span class="cd-zatca-v cd-zatca-mono">${escapeHtml(zatca.previousInvoiceHash)}</span></div>` : ""}
          </div>
        </div>
      </section>`
      : "";

  return `
    <article
      class="cd-document-root"
      data-document-engine="compact-document-template"
      data-company-logo-present="${model.company.logoUrl ? "true" : "false"}"
      data-document-kind="${escapeHtml(model.document.kind)}"
      data-doc-root="true"
      data-zatca-module="${zatca?.enabled ? "true" : "false"}"
      data-show-vat-totals="${showVatTotals ? "true" : "false"}"
      data-show-unit-column="${showUnitCol ? "true" : "false"}"
      data-show-vat-percent-column="${showVatPercentCol ? "true" : "false"}"
    >
      <header class="cd-header">
        <div class="cd-header-col cd-header-left">
          <div class="cd-h-label cd-h-label-en">Seller</div>
          <div class="cd-company-name cd-company-name-en">${escapeHtml(companyNameEn)}</div>
          <div class="cd-co-row"><span class="cd-co-k">CR</span><span class="cd-co-v">${escapeHtml(model.company.crNumber || "—")}</span></div>
          <div class="cd-co-block">${escapeHtml(model.company.addressEn || "—")}</div>
          <div class="cd-co-contact">${escapeHtml([model.company.email, model.company.phone].filter(Boolean).join(" · ") || "—")}</div>
        </div>
        <div class="cd-header-col cd-header-center">
          <img src="${logoSrc}" alt="" class="cd-logo-img" />
        </div>
        <div class="cd-header-col cd-header-right" dir="rtl" lang="ar">
          <div class="cd-h-label cd-h-label-ar">البائع</div>
          <div class="cd-company-name cd-company-name-ar">${escapeHtml(companyNameAr)}</div>
          <div class="cd-co-row"><span class="cd-co-v">${escapeHtml(model.company.crNumber || "—")}</span><span class="cd-co-k">سجل تجاري</span></div>
          <div class="cd-co-block">${escapeHtml(model.company.addressAr || "—")}</div>
          <div class="cd-co-contact">${escapeHtml([model.company.phone, model.company.email].filter(Boolean).join(" · ") || "—")}</div>
        </div>
      </header>

      <section class="cd-title-section">
        <h1 class="cd-doc-title-stack">
          <span class="cd-doc-title-en-block">${escapeHtml(model.document.titleEn)}</span>
          <span class="cd-doc-title-ar-block" dir="rtl" lang="ar">${escapeHtml(model.document.titleAr)}</span>
        </h1>
        ${subtitleBadgeBlock}
      </section>

      ${metaSection}

      ${customerSection}

      <section class="cd-lines-section">
        <div class="cd-table-scroll">
          <table class="cd-line-table" data-line-items-table="true">
            <thead><tr>${theadCells.join("")}</tr></thead>
            <tbody>${linesHtml}</tbody>
          </table>
        </div>
      </section>

      <section class="cd-totals-section">
        <div class="cd-totals-card" data-totals-box="true">
          <div class="cd-total-line">
            <div class="cd-total-labels"><span class="cd-tlbl-en">Subtotal</span><span class="cd-tlbl-ar" dir="rtl" lang="ar">المجموع الفرعي</span></div>
            <div class="cd-total-currency">${escapeHtml(model.invoice.currency)}</div>
            <div class="cd-total-amt">${escapeHtml(formatCurrency.format(model.invoice.subtotal))}</div>
          </div>
          ${
            showVatTotals
              ? `<div class="cd-total-line">
            <div class="cd-total-labels"><span class="cd-tlbl-en">VAT Total</span><span class="cd-tlbl-ar" dir="rtl" lang="ar">إجمالي ضريبة القيمة المضافة</span></div>
            <div class="cd-total-currency">${escapeHtml(model.invoice.currency)}</div>
            <div class="cd-total-amt">${escapeHtml(formatCurrency.format(model.invoice.vatTotal))}</div>
          </div>`
              : ""
          }
          <div class="cd-total-line cd-total-grand">
            <div class="cd-total-labels"><span class="cd-tlbl-en">Grand Total</span><span class="cd-tlbl-ar" dir="rtl" lang="ar">الإجمالي الكلي</span></div>
            <div class="cd-total-currency">${escapeHtml(model.invoice.currency)}</div>
            <div class="cd-total-amt">${escapeHtml(formatCurrency.format(model.invoice.grandTotal))}</div>
          </div>
        </div>
      </section>

      ${amountWordsBlock}
      ${notesBlock}
      ${zatcaBlock}
      ${footerBlock}
    </article>`;
}
