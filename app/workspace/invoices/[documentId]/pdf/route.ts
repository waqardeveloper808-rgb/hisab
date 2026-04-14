import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  return NextResponse.redirect(new URL(`/api/workspace/documents/${documentId}/export-pdf`, request.url));
}