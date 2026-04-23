# Workspace UI Audit Protocol Seeds

Updated: 2026-04-23
Status: Seed document for future workspace UI audit expectations.

## 1. Audit Seed Authority

- `UX-AUD-001`: These audit seeds shall be used to shape future workspace UI audit protocol generation.
- `UX-AUD-002`: These seeds shall remain subordinate to the workspace constitution, route ownership law, and panel behavior standard.

## 2. Expected Audit Areas

### 2.1 Workspace behavior

- `UX-AUD-010`: Expected workspace behavior must include shell correctness, role correctness, and route clarity.

### 2.2 Route ownership

- `UX-AUD-020`: Expected route ownership must verify a declared owner engine for every claimed route.
- `UX-AUD-021`: Missing or generic placeholder routes must fail audit.

### 2.3 Panel behavior

- `UX-AUD-030`: Expected panel behavior must verify collapse, expand, close, restore, and resize where declared.
- `UX-AUD-031`: Panel state continuity must be checked across reopen and navigation.

### 2.4 Preview workflow

- `UX-AUD-040`: Expected preview workflow must verify register to preview to detail continuity.
- `UX-AUD-041`: Dead-end preview states must fail audit.

### 2.5 Density and responsiveness

- `UX-AUD-050`: Expected density and responsiveness must verify efficient use of space, controlled overflow, and predictable reflow.
- `UX-AUD-051`: Mega-card waste and accidental empty space must fail audit where they impede task work.

## 3. Evidence Types

- `UX-AUD-060`: Audit evidence shall include route captures, layout captures, panel state captures, record-view transitions, and responsive resize captures where applicable.
- `UX-AUD-061`: Audit evidence shall include route maps, component ownership traces, and screenshot or DOM proof where needed.

## 4. Likely Root-Cause Zones

- `UX-AUD-070`: Likely root-cause zones include route registry drift, shell behavior drift, panel state bugs, preview state loss, density regression, and viewport-specific layout collapse.

