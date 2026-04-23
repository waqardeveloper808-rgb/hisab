# Workspace Route Ownership

Updated: 2026-04-23
Status: Mandatory route truth and page ownership law.

## 1. Route Truth

### 1.1 Clause IDs

- `UX-ROUTE-001`: Every route shall have a declared owner engine.
- `UX-ROUTE-002`: Every sidebar item that claims a business module shall resolve to a real operational page.
- `UX-ROUTE-003`: Register, create, edit, detail, preview, split-view, and report routes shall each have explicit ownership.

### 1.2 Placeholder prohibition

- `UX-ROUTE-010`: Generic placeholder routes shall not count as shipped workflow.
- `UX-ROUTE-011`: Workspace shell shall not mask missing modules with generic cards or fake overview pages.
- `UX-ROUTE-012`: A navigational claim without a real route owner shall be treated as a governance defect.

### 1.3 Ownership mapping

- `UX-ROUTE-020`: Each route family shall be mapped to one accountable engine or module owner.
- `UX-ROUTE-021`: The same route family shall not have competing owners.
- `UX-ROUTE-022`: Route ownership shall be visible in governance records and audits.

## 2. Role Route Law

- `UX-ROUTE-030`: User Workspace routes shall own business execution paths only.
- `UX-ROUTE-031`: Admin Workspace routes shall own platform governance paths only.
- `UX-ROUTE-032`: Assistant and Agent Workspace routes shall own support and commercial operation paths only.

