import { NextResponse } from "next/server";
import { getAuditSession, getControlResult } from "@/lib/audit-engine/store";

export async function GET(_request: Request, { params }: { params: { auditId: string; controlId: string } }) {
  const [session, result] = await Promise.all([
    getAuditSession(params.auditId),
    getControlResult(params.auditId, params.controlId),
  ]);

  if (!session || !result) {
    return NextResponse.json({ error: "Control result not found." }, { status: 404 });
  }

  return NextResponse.json({
    audit_id: params.auditId,
    control_result: result,
  });
}
