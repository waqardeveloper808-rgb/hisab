# Governance Runtime Binding Model

## 1. Binding Model
1.1 Human-readable markdown constitutions shall be the source law.
1.2 JSON registries shall be machine-readable derivatives.
1.3 The control-point engine shall consume the control-point registry.
1.4 The audit engine shall consume the governance mappings and control registry.
1.5 The Architect Dashboard shall consume status outputs from enforcement and audit layers.
1.6 Implementation tasks shall consume governance references, not stale copies.

## 2. Forbidden Binding Patterns
2.1 Direct runtime dependence on stale or deprecated governance files shall be forbidden.
2.2 Manual copy-paste drift shall be forbidden.
2.3 Disconnected audit, control, and UI status models shall be forbidden.

## 3. Clause IDs
3.1 Stable clauses in this document use the prefix `SYS-BIND`.

## 4. Enforceable Clauses
- `SYS-BIND-001`: Markdown constitutions shall be source law.
- `SYS-BIND-002`: JSON registries shall be derivatives.
- `SYS-BIND-003`: Control and audit engines shall consume governed registries.
- `SYS-BIND-004`: Stale or deprecated governance files shall not be runtime dependencies.
