import { NextResponse } from "next/server";
import { type BuildPdfInput } from "@/lib/workspace/exports/pdf";
import { buildTemplateStudioPdfHtml } from "@/lib/workspace/exports/template-studio-html";
import { generatePdfFromHtml } from "@/lib/pdf/simple-pdf";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  let body: BuildPdfInput;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = (await req.json()) as BuildPdfInput;
    } else {
      const form = await req.formData();
      const raw = form.get("payload");
      if (typeof raw !== "string" || !raw.trim()) {
        return NextResponse.json({ error: "missing-payload" }, { status: 400 });
      }
      body = JSON.parse(raw) as BuildPdfInput;
    }
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  try {
    const html = await buildTemplateStudioPdfHtml(body);
    const bytes = await generatePdfFromHtml(html);
    const filename = `${body.doc.number || body.doc.id || "template-studio"}.pdf`.replace(/[^\w.\- ()]/g, "_");
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Hisabix-Document-Engine": "v3",
        "X-Hisabix-Template-Style": String((body as { style?: string }).style ?? "standard"),
        "X-Hisabix-Document-Type": String((body as { documentType?: string }).documentType ?? "tax_invoice"),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "pdf-build-failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
