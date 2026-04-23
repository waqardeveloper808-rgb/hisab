import { NextResponse } from "next/server";
import { getAuditSession, getControlResult } from "@/lib/audit-engine/store";

export async function GET(_request: Request, context: { params: Promise<{ auditId: string; controlId: string }> }) {
  const { auditId, controlId } = await context.params;
  const [session, result] = await Promise.all([
    getAuditSession(auditId),
    getControlResult(auditId, controlId),
  ]);

  if (!session || !result) {
    return NextResponse.json({ error: "Control result not found." }, { status: 404 });
  }

  return NextResponse.json({
    audit_id: auditId,
    control_result: result,
  });
}
