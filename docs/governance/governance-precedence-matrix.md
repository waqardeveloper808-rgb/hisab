# Governance Precedence Matrix

## 1. Precedence Order
1.1 Constitution
1.2 Master Design
1.3 Standards and module constitutions
1.4 Control Points
1.5 Audit Protocols
1.6 Runtime implementation
1.7 UI claims and agent summaries

## 2. Conflict Rule
2.1 Higher precedence shall win in any conflict.
2.2 Lower precedence artifacts shall be treated as derivative or advisory only.
2.3 Deprecated files shall never resolve conflicts.

## 3. Derivative Rule
3.1 JSON registries shall inherit from constitutional markdown sources.
3.2 Runtime maps shall inherit from the governed registries and shall not redefine law.

## 4. Clause IDs
4.1 Stable clauses in this document use the prefix `SYS-PRE`.

## 5. Enforceable Clauses
- `SYS-PRE-001`: Higher precedence shall win in conflict.
- `SYS-PRE-002`: Lower precedence artifacts shall be derivative or advisory only.
- `SYS-PRE-003`: JSON registries shall inherit from markdown law.
- `SYS-PRE-004`: Runtime maps shall not redefine law.
