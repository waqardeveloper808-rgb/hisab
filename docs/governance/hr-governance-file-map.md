# HR Governance File Map

## 1. Authoritative Source Files
1.1 `docs/governance/employee-system-constitution.md`
1.2 `docs/governance/timesheet-attendance-constitution.md`
1.3 `docs/governance/payroll-engine-constitution.md`
1.4 `docs/governance/payroll-accounting-integration.md`
1.5 `docs/governance/hr-control-point-seeds.md`
1.6 `docs/governance/hr-audit-protocol-seeds.md`

## 2. Retain
2.1 Higher-level governance packs remain in place and are retained as upstream authority.
2.2 Runtime employee, attendance, payroll, and accounting implementation files are retained as implementation-only.

## 3. Replace
3.1 Legacy HR assumptions shall be replaced by the new constitutional pack.
3.2 Any HR guidance that permits payroll without journal output shall be replaced.

## 4. Deprecate
4.1 Manual salary override without logs shall be deprecated.
4.2 Payroll without attendance basis shall be deprecated.
4.3 Orphan HR records shall be deprecated.

## 5. Ignore as Source of Truth
5.1 `.next/` shall be treated as build output.
5.2 Generated artifacts shall not be treated as source of truth.

## 6. Inheritance
6.1 Future prompts shall inherit from the governing constitution hierarchy in `docs/governance`.
6.2 Future control points and audits shall reference stable clause IDs.
