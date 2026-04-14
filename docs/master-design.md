# Gulf Hisab Master Design

## Source Of Truth For This Workspace

This local Master Design is derived from the active product instructions in the project conversation because the incoming Master Design block was empty.

## Product Split

- Public website: marketing, plans, account access, public help center.
- Authenticated workspace: day-to-day finance work only.

## Workspace Principles

- One calm shell for all daily finance work.
- One obvious primary action per module.
- No dead-end forms.
- Searchable controls for linked records.
- Inline add-and-continue for missing customer, supplier, and item records.
- Quiet help and onboarding inside the workspace.
- Business language only in user-visible UI.

## Workspace Modules

- Dashboard
- Sales
- Purchases
- Accounting
- Banking
- VAT and compliance
- Reports
- Contacts
- Settings
- Help

## Required Supporting Routes

- Sales transaction entry: invoice create
- Purchases transaction entry: bill create
- Accounting books scaffolding
- Reports register scaffolding
- Settings template scaffolding
- Help FAQ scaffolding
- Help AI help scaffolding

## Frontend Foundation

- Shared workspace shell with grouped module navigation
- Shared module metadata instead of page-by-page hardcoding
- Shared module landing component pattern
- Shared resource cards for registers, books, templates, summaries, and help
- Shared workflow state layer with backend-aware adapters and safe fallback mode

## Backend Connection Direction

- Use live Laravel API connection points where routes already exist.
- At minimum, contact create, item create, and report-summary connection points should be wired for frontend use.
- Preserve working frontend fallback where backend list or auth flows are not available yet.

## This Run Coverage

- Normalize public/workspace separation
- Normalize workspace shell and module hierarchy
- Add module landing routes and scaffolding
- Add registers, books, templates, FAQ, and AI help scaffolding
- Wire backend-aware frontend adapters for supported create and summary paths