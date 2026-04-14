import { NextRequest, NextResponse } from "next/server";
import { authSessionCookieName, readAuthSession } from "@/lib/auth-session";
import {
  createPreviewContact,
  createPreviewAsset,
  createPreviewDocument,
  createPreviewItem,
  createPreviewPayment,
  createPreviewTemplate,
  duplicatePreviewDocument,
  finalizePreviewDocument,
  getPreviewDocumentDetail,
  getPreviewDocumentPdf,
  getPreviewDocumentPreview,
  listPreviewAuditTrail,
  listPreviewAssets,
  listPreviewBillsRegister,
  listPreviewCostCenters,
  listPreviewContacts,
  listPreviewCustomFieldDefinitions,
  listPreviewDocuments,
  listPreviewExpenseBreakdown,
  listPreviewGeneralLedger,
  listPreviewInvoiceRegister,
  listPreviewItems,
  listPreviewPayments,
  listPreviewPayablesAging,
  listPreviewProfitByCustomer,
  listPreviewProfitByProduct,
  listPreviewReceivablesAging,
  listPreviewTemplates,
  listPreviewTrialBalance,
  listPreviewVatDetail,
  listPreviewVatSummary,
  getPreviewBalanceSheet,
  getPreviewProfitLoss,
  renderPreviewTemplateHtml,
  sendPreviewDocument,
  updatePreviewDocument,
  updatePreviewTemplate,
} from "@/lib/workspace-preview";

export const dynamic = "force-dynamic";

const allowedRoots = new Set([
  "agents",
  "access-profile",
  "contacts",
  "items",
  "documents",
  "templates",
  "assets",
  "cost-centers",
  "custom-fields",
  "payments",
  "supplier-payments",
  "settings",
  "users",
  "sales-documents",
  "purchase-documents",
  "reports",
]);

function getBackendConfig() {
  const baseUrl = process.env.GULF_HISAB_API_BASE_URL ?? process.env.NEXT_PUBLIC_GULF_HISAB_API_BASE_URL;
  const companyId = process.env.GULF_HISAB_COMPANY_ID ?? process.env.NEXT_PUBLIC_GULF_HISAB_COMPANY_ID;
  const apiToken = process.env.GULF_HISAB_API_TOKEN ?? process.env.WORKSPACE_API_TOKEN;

  if (! baseUrl || ! companyId || ! apiToken) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    companyId,
    apiToken,
  };
}

async function handle(request: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  const config = getBackendConfig();
  const session = await readAuthSession(request.cookies.get(authSessionCookieName)?.value);
  const { slug } = await context.params;

  if (! slug.length || ! allowedRoots.has(slug[0])) {
    return NextResponse.json({ message: "Unsupported workspace path." }, { status: 404 });
  }

  if (! session) {
    return handlePreviewRequest(request, slug);
  }

  if (! config) {
    return NextResponse.json(
      { message: "Workspace backend is not configured." },
      { status: 503 },
    );
  }

  const search = request.nextUrl.search;
  const targetUrl = `${config.baseUrl}/api/companies/${config.companyId}/${slug.join("/")}${search}`;
  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    method: request.method,
    body,
    cache: "no-store",
    headers: {
      "Accept": slug[slug.length - 1] === "export-pdf" ? "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8" : "application/json",
      ...(request.headers.get("content-type") ? { "Content-Type": request.headers.get("content-type") as string } : {}),
      "X-Gulf-Hisab-Actor-Id": String(session.id),
      "X-Gulf-Hisab-Workspace-Token": config.apiToken,
    },
  });

  const payload = request.method === "HEAD" || response.status === 204 || response.status === 304
    ? null
    : await response.arrayBuffer();

  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  const contentDisposition = response.headers.get("content-disposition");
  const cacheControl = response.headers.get("cache-control");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (contentDisposition) {
    headers.set("Content-Disposition", contentDisposition);
  }

  if (cacheControl) {
    headers.set("Cache-Control", cacheControl);
  }

  return new NextResponse(payload, {
    status: response.status,
    headers,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

async function handlePreviewRequest(request: NextRequest, slug: string[]) {
  if (slug[0] === "contacts") {
    if (request.method === "GET") {
      const type = request.nextUrl.searchParams.get("type");
      const contacts = await listPreviewContacts(type === "customer" || type === "supplier" ? type : undefined);
      return NextResponse.json({ data: contacts }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST") {
      const payload = await request.json();
      const created = await createPreviewContact(payload as {
        type: "customer" | "supplier";
        display_name: string;
        email?: string | null;
        phone?: string | null;
        billing_address?: { city?: string | null } | null;
      });
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "items") {
    if (request.method === "GET") {
      return NextResponse.json({ data: await listPreviewItems() }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST") {
      const payload = await request.json();
      const created = await createPreviewItem(payload as {
        type: "product" | "service";
        name: string;
        sku?: string | null;
        default_sale_price?: number | null;
        default_purchase_price?: number | null;
      });
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "assets") {
    if (request.method === "GET") {
      return NextResponse.json({ data: await listPreviewAssets() }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST") {
      const formData = await request.formData();
      const file = formData.get("file");
      const type = String(formData.get("type") ?? "logo").trim();
      const usage = String(formData.get("usage") ?? "logo").trim();

      if (!(file instanceof File)) {
        return NextResponse.json({ message: "Asset file is required." }, { status: 400, headers: { "X-Workspace-Mode": "preview" } });
      }

      const created = await createPreviewAsset({
        type,
        usage,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        bytes: new Uint8Array(await file.arrayBuffer()),
      });

      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "custom-fields" && request.method === "GET") {
    return NextResponse.json({ data: listPreviewCustomFieldDefinitions() }, { headers: { "X-Workspace-Mode": "preview" } });
  }

  if (slug[0] === "cost-centers" && request.method === "GET") {
    return NextResponse.json({ data: listPreviewCostCenters() }, { headers: { "X-Workspace-Mode": "preview" } });
  }

  if (slug[0] === "templates") {
    if (request.method === "GET" && slug.length === 1) {
      return NextResponse.json({ data: await listPreviewTemplates() }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug[1] === "preview") {
      const payload = await request.json();
      return NextResponse.json({ data: renderPreviewTemplateHtml(payload, String(payload.document_type ?? payload.document_types?.[0] ?? "tax_invoice")) }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug.length === 1) {
      const payload = await request.json();
      const created = await createPreviewTemplate(payload);
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }

    if ((request.method === "PUT" || request.method === "PATCH") && slug.length === 2) {
      const payload = await request.json();
      const updated = await updatePreviewTemplate(Number(slug[1]), payload);
      return NextResponse.json({ data: updated }, { headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "documents") {
    if (request.method === "GET" && slug.length === 1) {
      const searchParams = request.nextUrl.searchParams;
      const documents = await listPreviewDocuments({
        group: searchParams.get("group"),
        type: searchParams.get("type"),
        status: searchParams.get("status"),
        search: searchParams.get("search"),
        fromDate: searchParams.get("from_date"),
        toDate: searchParams.get("to_date"),
        minTotal: searchParams.get("min_total") ? Number(searchParams.get("min_total")) : null,
        maxTotal: searchParams.get("max_total") ? Number(searchParams.get("max_total")) : null,
      });
      return NextResponse.json({ data: documents }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "GET" && slug.length === 2) {
      const document = await getPreviewDocumentDetail(Number(slug[1]));

      if (!document) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: document }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "GET" && slug[2] === "preview") {
      const preview = await getPreviewDocumentPreview(Number(slug[1]), request.nextUrl.searchParams.get("template_id") ? Number(request.nextUrl.searchParams.get("template_id")) : null);

      if (!preview) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: preview }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "GET" && slug[2] === "export-pdf") {
      const pdf = await getPreviewDocumentPdf(Number(slug[1]));

      if (!pdf) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return new NextResponse(Buffer.from(pdf.bytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${pdf.fileName}"`,
          "Cache-Control": "no-store",
          "X-Workspace-Mode": "preview",
        },
      });
    }

    if (request.method === "POST" && slug[2] === "duplicate") {
      const duplicate = await duplicatePreviewDocument(Number(slug[1]));

      if (!duplicate) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: duplicate }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug[2] === "send") {
      const payload = await request.json().catch(() => ({}));
      const sent = await sendPreviewDocument(Number(slug[1]), payload as { email?: string | null; subject?: string | null });

      if (!sent) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: sent }, { headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "sales-documents" || slug[0] === "purchase-documents") {
    const kind = slug[0] === "sales-documents" ? "sales" : "purchase";

    if (request.method === "POST" && slug.length === 1) {
      const payload = await request.json();
      const created = await createPreviewDocument(kind, payload);
      return NextResponse.json({ data: created }, { status: 201, headers: { "X-Workspace-Mode": "preview" } });
    }

    if ((request.method === "PUT" || request.method === "PATCH") && slug.length === 2) {
      const payload = await request.json();
      const updated = await updatePreviewDocument(Number(slug[1]), kind, payload);

      if (!updated) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: updated }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug[2] === "finalize") {
      const finalized = await finalizePreviewDocument(Number(slug[1]));

      if (!finalized) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: finalized }, { headers: { "X-Workspace-Mode": "preview" } });
    }

    if (request.method === "POST" && slug[2] === "payments") {
      const payload = await request.json();
      const created = await createPreviewPayment(Number(slug[1]), kind === "sales" ? "incoming" : "outgoing", payload);

      if (!created) {
        return NextResponse.json({ message: "Preview document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: created }, { headers: { "X-Workspace-Mode": "preview" } });
    }
  }

  if (slug[0] === "reports" && request.method === "GET") {
    switch (slug[1]) {
      case "invoice-register":
        return NextResponse.json({ data: await listPreviewInvoiceRegister() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "bills-register":
        return NextResponse.json({ data: await listPreviewBillsRegister() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "payments-register":
        return NextResponse.json({ data: await listPreviewPayments() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "trial-balance":
        return NextResponse.json({ data: await listPreviewTrialBalance() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "vat-summary":
        return NextResponse.json({ data: await listPreviewVatSummary() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "vat-detail":
        return NextResponse.json({ data: await listPreviewVatDetail() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "receivables-aging":
        return NextResponse.json({ data: await listPreviewReceivablesAging() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "payables-aging":
        return NextResponse.json({ data: await listPreviewPayablesAging() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "profit-loss":
        return NextResponse.json({ data: await getPreviewProfitLoss() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "balance-sheet":
        return NextResponse.json({ data: await getPreviewBalanceSheet() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "profit-by-customer":
        return NextResponse.json({ data: await listPreviewProfitByCustomer() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "profit-by-product":
        return NextResponse.json({ data: await listPreviewProfitByProduct() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "expense-breakdown":
        return NextResponse.json({ data: await listPreviewExpenseBreakdown() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "general-ledger":
        return NextResponse.json({ data: await listPreviewGeneralLedger() }, { headers: { "X-Workspace-Mode": "preview" } });
      case "audit-trail":
        return NextResponse.json({ data: await listPreviewAuditTrail() }, { headers: { "X-Workspace-Mode": "preview" } });
      default:
        break;
    }
  }

  return NextResponse.json(
    { message: "Preview mode is read-only for this endpoint." },
    { status: 403, headers: { "X-Workspace-Mode": "preview" } },
  );
}