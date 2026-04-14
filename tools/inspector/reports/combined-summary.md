# Workspace Inspector Summary

Generated: 2026-04-14T06:37:06.318Z

Routes inspected: 6
PASS: 0
FAIL: 2
AUTH_LIMITED: 0
PLACEHOLDER: 4
EMPTY_VALID: 0

## Route Verdicts

- /workspace/user/invoices: FAIL | rows=0 | zatca=NOT_AVAILABLE
- /workspace/user/customers: PLACEHOLDER | rows=0 | zatca=NOT_AVAILABLE
- /workspace/user/payments: PLACEHOLDER | rows=0 | zatca=NOT_AVAILABLE
- /workspace/user/vendors: PLACEHOLDER | rows=0 | zatca=NOT_AVAILABLE
- /workspace/user/document-templates: FAIL | rows=50 | zatca=NOT_AVAILABLE
- /workspace/user/chart-of-accounts: PLACEHOLDER | rows=0 | zatca=NOT_AVAILABLE

## Root Cause Highlights

- /workspace/user/invoices: Inspection is executing against guest preview instead of a seeded authenticated workspace, so protected module APIs fail before data can render. Heading responsibility is duplicated between the shell and the page body on operational routes.
- /workspace/user/customers: Module navigation is ahead of module implementation, and the catch-all fallback masks missing route ownership. Inspection is executing against guest preview instead of a seeded authenticated workspace, so protected module APIs fail before data can render. Heading responsibility is duplicated between the shell and the page body on operational routes.
- /workspace/user/payments: Module navigation is ahead of module implementation, and the catch-all fallback masks missing route ownership. Inspection is executing against guest preview instead of a seeded authenticated workspace, so protected module APIs fail before data can render. Heading responsibility is duplicated between the shell and the page body on operational routes.
- /workspace/user/vendors: Module navigation is ahead of module implementation, and the catch-all fallback masks missing route ownership. Inspection is executing against guest preview instead of a seeded authenticated workspace, so protected module APIs fail before data can render. Heading responsibility is duplicated between the shell and the page body on operational routes.
- /workspace/user/document-templates: Inspection is executing against guest preview instead of a seeded authenticated workspace, so protected module APIs fail before data can render. Heading responsibility is duplicated between the shell and the page body on operational routes.
- /workspace/user/chart-of-accounts: Module navigation is ahead of module implementation, and the catch-all fallback masks missing route ownership. Inspection is executing against guest preview instead of a seeded authenticated workspace, so protected module APIs fail before data can render. Heading responsibility is duplicated between the shell and the page body on operational routes.

