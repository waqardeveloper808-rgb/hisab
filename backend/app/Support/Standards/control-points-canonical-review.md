# Control Points Canonical Review

--------------------------------------------------
CONTROL POINT ID: ACC-001
CATEGORY: ACC
TITLE: Double Entry Enforcement

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prevent ledger corruption by ensuring every journal remains balanced.
- rule: Total debit must equal total credit at transaction save and post time for all journal transactions.
- condition: When the system executes or validates ledger integrity behavior that falls under double entry enforcement.
- expected_behavior: The system enforces double entry enforcement consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Double Entry Enforcement is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Double Entry Enforcement is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-002
CATEGORY: ACC
TITLE: Accounting Equation Integrity

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Protect ledger-level balance-sheet truth after every posting cycle.
- rule: Postings must preserve Assets = Liabilities + Equity at ledger level.
- condition: When the system executes or validates ledger integrity behavior that falls under accounting equation integrity.
- expected_behavior: The system enforces accounting equation integrity consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Accounting Equation Integrity is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Accounting Equation Integrity is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-003
CATEGORY: ACC
TITLE: Compound Entry Support

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Allow valid multi-line accounting transactions without breaking transaction unity.
- rule: A single transaction may validly contain three or more account lines and must remain one transaction.
- condition: When the system executes or validates journal design behavior that falls under compound entry support.
- expected_behavior: The system enforces compound entry support consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Compound Entry Support is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Compound Entry Support is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-004
CATEGORY: ACC
TITLE: Contra Account Polarity

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure contra balances are modeled and reviewed with the correct opposite orientation.
- rule: Contra accounts must carry balance orientation opposite to parent classification.
- condition: When the system executes or validates chart of accounts behavior that falls under contra account polarity.
- expected_behavior: The system enforces contra account polarity consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Contra Account Polarity is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Contra Account Polarity is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-005
CATEGORY: ACC
TITLE: Discount Allowed Posting

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure discounts granted to customers remain visible in financial reporting.
- rule: Discount allowed must post to dedicated expense or revenue-reduction logic and must not disappear silently.
- condition: When the system executes or validates commercial posting behavior that falls under discount allowed posting.
- expected_behavior: The system enforces discount allowed posting consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Discount Allowed Posting is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Discount Allowed Posting is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-006
CATEGORY: ACC
TITLE: Discount Received Posting

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure supplier-side discounts are recorded through explicit accounting treatment.
- rule: Discount received must post to dedicated income or cost-reduction logic.
- condition: When the system executes or validates commercial posting behavior that falls under discount received posting.
- expected_behavior: The system enforces discount received posting consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Discount Received Posting is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Discount Received Posting is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-007
CATEGORY: ACC
TITLE: Revenue Recognition - Contract Identification

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare revenue accounting for IFRS 15 step 1 contract identification.
- rule: System must support identifying contract as the first IFRS 15 step before revenue recognition begins.
- condition: When the system executes or validates revenue recognition behavior that falls under revenue recognition - contract identification.
- expected_behavior: The system enforces revenue recognition - contract identification consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Revenue Recognition - Contract Identification is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Revenue Recognition - Contract Identification is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-008
CATEGORY: ACC
TITLE: Revenue Recognition - Performance Obligations

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare the accounting layer to separate obligations within a customer contract.
- rule: System must support separate obligations like license, service, support, and delivery.
- condition: When the system executes or validates revenue recognition behavior that falls under revenue recognition - performance obligations.
- expected_behavior: The system enforces revenue recognition - performance obligations consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Revenue Recognition - Performance Obligations is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Revenue Recognition - Performance Obligations is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-009
CATEGORY: ACC
TITLE: Revenue Recognition - Transaction Price

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure transaction price is captured before recognition logic runs.
- rule: System must store determinable transaction price before recognition.
- condition: When the system executes or validates revenue recognition behavior that falls under revenue recognition - transaction price.
- expected_behavior: The system enforces revenue recognition - transaction price consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Revenue Recognition - Transaction Price is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Revenue Recognition - Transaction Price is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-010
CATEGORY: ACC
TITLE: Revenue Recognition - Allocation

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Support allocation of contract price across obligations for compliant reporting.
- rule: Transaction price allocation across obligations must be supported.
- condition: When the system executes or validates revenue recognition behavior that falls under revenue recognition - allocation.
- expected_behavior: The system enforces revenue recognition - allocation consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Revenue Recognition - Allocation is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Revenue Recognition - Allocation is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-011
CATEGORY: ACC
TITLE: Revenue Recognition - Transfer of Control

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure recognition timing follows the actual transfer-of-control event.
- rule: Revenue recognition timing must follow transfer-of-control event logic.
- condition: When the system executes or validates revenue recognition behavior that falls under revenue recognition - transfer of control.
- expected_behavior: The system enforces revenue recognition - transfer of control consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Revenue Recognition - Transfer of Control is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Revenue Recognition - Transfer of Control is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-012
CATEGORY: ACC
TITLE: Deferred Revenue Handling

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep unearned revenue on the balance sheet until release conditions are met.
- rule: Advance-billed but not-yet-earned amounts must remain deferred until release conditions are met.
- condition: When the system executes or validates balance sheet timing behavior that falls under deferred revenue handling.
- expected_behavior: The system enforces deferred revenue handling consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Deferred Revenue Handling is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Deferred Revenue Handling is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-013
CATEGORY: ACC
TITLE: Prepaid Expense Handling

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep prepaid assets from being recognized too early.
- rule: Prepaid amounts must remain on the balance sheet until recognized over time or use.
- condition: When the system executes or validates balance sheet timing behavior that falls under prepaid expense handling.
- expected_behavior: The system enforces prepaid expense handling consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Prepaid Expense Handling is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Prepaid Expense Handling is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-014
CATEGORY: ACC
TITLE: Accrued Expense Adjustments

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Allow period-end expense recognition even when supplier invoices arrive later.
- rule: Accrued expenses must be postable even if supplier invoice is not yet received.
- condition: When the system executes or validates period adjustments behavior that falls under accrued expense adjustments.
- expected_behavior: The system enforces accrued expense adjustments consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Accrued Expense Adjustments is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Accrued Expense Adjustments is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-015
CATEGORY: ACC
TITLE: Matching Principle Enforcement

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Support expense timing aligned with associated revenue periods when applicable.
- rule: Expense recognition should align to associated revenue period when applicable.
- condition: When the system executes or validates period matching behavior that falls under matching principle enforcement.
- expected_behavior: The system enforces matching principle enforcement consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Matching Principle Enforcement is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Matching Principle Enforcement is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-016
CATEGORY: ACC
TITLE: Trial Balance Validation

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Expose imbalance risk directly in the reporting layer.
- rule: Trial balance must calculate and expose imbalance if present.
- condition: When the system executes or validates reporting integrity behavior that falls under trial balance validation.
- expected_behavior: The system enforces trial balance validation consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Trial Balance Validation is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Trial Balance Validation is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-017
CATEGORY: ACC
TITLE: Period Closing Block

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prevent financial period closure when integrity issues remain unresolved.
- rule: Close or lock period must fail if trial balance or posting integrity issues remain.
- condition: When the system executes or validates period governance behavior that falls under period closing block.
- expected_behavior: The system enforces period closing block consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Period Closing Block is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Period Closing Block is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-018
CATEGORY: ACC
TITLE: Journal Immutability After Final Post

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Protect posted audit trails from destructive edits.
- rule: Finalized journals must not be destructively edited; only reversal or adjustment path is allowed.
- condition: When the system executes or validates journal governance behavior that falls under journal immutability after final post.
- expected_behavior: The system enforces journal immutability after final post consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Journal Immutability After Final Post is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Journal Immutability After Final Post is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-019
CATEGORY: ACC
TITLE: Reversal Entry Integrity

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure reversals preserve original transaction lineage.
- rule: Reversal must preserve traceability to original transaction.
- condition: When the system executes or validates journal governance behavior that falls under reversal entry integrity.
- expected_behavior: The system enforces reversal entry integrity consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Reversal Entry Integrity is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Reversal Entry Integrity is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-020
CATEGORY: ACC
TITLE: Source Document Traceability

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep accounting entries permanently tied to their originating business document.
- rule: Journal must keep immutable source UUID or reference to originating business document.
- condition: When the system executes or validates traceability behavior that falls under source document traceability.
- expected_behavior: The system enforces source document traceability consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Source Document Traceability is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Source Document Traceability is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-021
CATEGORY: ACC
TITLE: Subledger-to-GL Consistency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure customer and vendor subledgers reconcile back to controlling accounts.
- rule: AR, AP, customer, and vendor balances must reconcile to controlling GL accounts.
- condition: When the system executes or validates reconciliation behavior that falls under subledger-to-gl consistency.
- expected_behavior: The system enforces subledger-to-gl consistency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Subledger-to-GL Consistency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Subledger-to-GL Consistency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: ACC-022
CATEGORY: ACC
TITLE: Multi-Currency Posting Readiness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare the accounting standards layer for foreign currency traceability and reporting.
- rule: Accounting control point structure must be ready for base versus foreign currency storage and audit trace.
- condition: When the system executes or validates currency readiness behavior that falls under multi-currency posting readiness.
- expected_behavior: The system enforces multi-currency posting readiness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Multi-Currency Posting Readiness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Multi-Currency Posting Readiness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: BRD-001
CATEGORY: BRD
TITLE: Full Wordmark Usage Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure the full Gulf Hisab wordmark is used wherever full brand identity is required.
- rule: Use Gulf Hisab SVG Logo 1 where full brand identity is required.
- condition: When the system executes or validates brand asset governance behavior that falls under full wordmark usage rule.
- expected_behavior: The system enforces full wordmark usage rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Full Wordmark Usage Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Full Wordmark Usage Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: BRD-002
CATEGORY: BRD
TITLE: Icon-Only Usage Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure icon-only branding is reserved for compact contexts.
- rule: Use Gulf Hisabl SVG Logo 2 only where compact icon usage is appropriate.
- condition: When the system executes or validates brand asset governance behavior that falls under icon-only usage rule.
- expected_behavior: The system enforces icon-only usage rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Icon-Only Usage Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Icon-Only Usage Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: BRD-003
CATEGORY: BRD
TITLE: Document Header Branding Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep official document headers aligned to approved brand usage.
- rule: Document headers must use approved Gulf Hisab branding consistently.
- condition: When the system executes or validates document branding behavior that falls under document header branding rule.
- expected_behavior: The system enforces document header branding rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Document Header Branding Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Document Header Branding Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: BRD-004
CATEGORY: BRD
TITLE: No Logo Overlap Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prevent logos from colliding with business content or legal fields.
- rule: Brand logos must not overlap document content or compliance fields.
- condition: When the system executes or validates document branding behavior that falls under no logo overlap rule.
- expected_behavior: The system enforces no logo overlap rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: No Logo Overlap Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: No Logo Overlap Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: BRD-005
CATEGORY: BRD
TITLE: Logo Resolution / Quality Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep document and UI outputs free from degraded branding quality.
- rule: Brand logos must render at approved resolution and quality.
- condition: When the system executes or validates asset quality behavior that falls under logo resolution / quality rule.
- expected_behavior: The system enforces logo resolution / quality rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Logo Resolution / Quality Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Logo Resolution / Quality Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: BRD-006
CATEGORY: BRD
TITLE: Watermark Governance Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Control when watermarking is allowed and how it appears.
- rule: Watermarks must follow governed business rules and must not compromise readability.
- condition: When the system executes or validates document branding behavior that falls under watermark governance rule.
- expected_behavior: The system enforces watermark governance rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Watermark Governance Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Watermark Governance Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: BRD-007
CATEGORY: BRD
TITLE: Bilingual Branding Layout Consistency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep bilingual branding balanced across English and Arabic layouts.
- rule: Branding layout must remain consistent across bilingual outputs.
- condition: When the system executes or validates localization behavior that falls under bilingual branding layout consistency.
- expected_behavior: The system enforces bilingual branding layout consistency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Bilingual Branding Layout Consistency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Bilingual Branding Layout Consistency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: BRD-008
CATEGORY: BRD
TITLE: Template Branding Consistency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure all approved templates respect the same official brand rules.
- rule: Templates must apply brand assets consistently across approved layouts.
- condition: When the system executes or validates template branding behavior that falls under template branding consistency.
- expected_behavior: The system enforces template branding consistency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Template Branding Consistency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Template Branding Consistency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: BRD-009
CATEGORY: BRD
TITLE: Output Branding Consistency Across Preview/PDF

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure branding does not drift between preview and final PDF outputs.
- rule: Branding must remain consistent across preview and PDF output.
- condition: When the system executes or validates rendering integrity behavior that falls under output branding consistency across preview/pdf.
- expected_behavior: The system enforces output branding consistency across preview/pdf consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Output Branding Consistency Across Preview/PDF is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Output Branding Consistency Across Preview/PDF is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-001
CATEGORY: DOC
TITLE: Mandatory Structured Data Presence

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure legally relevant invoice data exists beyond visual rendering.
- rule: Legal invoice fields must exist in structured representation, not just printed text.
- condition: When the system executes or validates structured documents behavior that falls under mandatory structured data presence.
- expected_behavior: The system enforces mandatory structured data presence consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Mandatory Structured Data Presence is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Mandatory Structured Data Presence is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-002
CATEGORY: DOC
TITLE: Preview-to-PDF Parity

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep previewed business truth aligned with exported PDF output.
- rule: Preview must match final rendered PDF materially and visually.
- condition: When the system executes or validates rendering integrity behavior that falls under preview-to-pdf parity.
- expected_behavior: The system enforces preview-to-pdf parity consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Preview-to-PDF Parity is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Preview-to-PDF Parity is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-003
CATEGORY: DOC
TITLE: PDF/A-3 Container Standard

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare document generation for hybrid archival compliance packaging.
- rule: PDF generation path must support hybrid archival PDF/A-3 model.
- condition: When the system executes or validates compliance rendering behavior that falls under pdf/a-3 container standard.
- expected_behavior: The system enforces pdf/a-3 container standard consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: PDF/A-3 Container Standard is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: PDF/A-3 Container Standard is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-004
CATEGORY: DOC
TITLE: Embedded XML Attachment Integrity

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep embedded XML retrievable after compliant document generation.
- rule: Embedded XML must remain attached and retrievable in compliant documents.
- condition: When the system executes or validates compliance rendering behavior that falls under embedded xml attachment integrity.
- expected_behavior: The system enforces embedded xml attachment integrity consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Embedded XML Attachment Integrity is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Embedded XML Attachment Integrity is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-005
CATEGORY: DOC
TITLE: Layout Order Standard

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure rendered documents follow approved master-design layout sequencing.
- rule: Invoice and document sections must follow approved order from master design.
- condition: When the system executes or validates layout governance behavior that falls under layout order standard.
- expected_behavior: The system enforces layout order standard consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Layout Order Standard is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Layout Order Standard is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-006
CATEGORY: DOC
TITLE: Hide Empty Fields

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Avoid noisy legal documents with meaningless empty labels or boxes.
- rule: Blank optional fields must not render as meaningless labels or boxes.
- condition: When the system executes or validates layout governance behavior that falls under hide empty fields.
- expected_behavior: The system enforces hide empty fields consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Hide Empty Fields is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Hide Empty Fields is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-007
CATEGORY: DOC
TITLE: Totals Accuracy

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure totals remain mathematically consistent across document output.
- rule: Subtotal, VAT, discounts, rounding, and grand total must reconcile.
- condition: When the system executes or validates totals integrity behavior that falls under totals accuracy.
- expected_behavior: The system enforces totals accuracy consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Totals Accuracy is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Totals Accuracy is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-008
CATEGORY: DOC
TITLE: Bilingual Support Readiness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare documents for stable English and Arabic output.
- rule: Template system must support English and Arabic layout consistency.
- condition: When the system executes or validates localization behavior that falls under bilingual support readiness.
- expected_behavior: The system enforces bilingual support readiness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Bilingual Support Readiness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Bilingual Support Readiness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-009
CATEGORY: DOC
TITLE: Multi-Page Continuity

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Maintain numbering and layout continuity across multi-page documents.
- rule: Multi-page documents must preserve numbering and layout continuity.
- condition: When the system executes or validates pagination behavior that falls under multi-page continuity.
- expected_behavior: The system enforces multi-page continuity consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Multi-Page Continuity is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Multi-Page Continuity is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-010
CATEGORY: DOC
TITLE: Multi-Layout Book Support

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep the engine structurally ready for mixed page layouts where needed.
- rule: Document engine should be structurally ready for mixed orientation and multi-layout pages.
- condition: When the system executes or validates layout readiness behavior that falls under multi-layout book support.
- expected_behavior: The system enforces multi-layout book support consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Multi-Layout Book Support is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Multi-Layout Book Support is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-011
CATEGORY: DOC
TITLE: External Attachment Linkage

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Allow business-supporting attachments to stay linked to the core document record.
- rule: Referenced supporting documents must be attachable and traceable.
- condition: When the system executes or validates evidence linkage behavior that falls under external attachment linkage.
- expected_behavior: The system enforces external attachment linkage consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: External Attachment Linkage is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: External Attachment Linkage is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-012
CATEGORY: DOC
TITLE: Structured vs Visual Consistency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prevent divergence between visible values and underlying structured data.
- rule: Values shown visually must match underlying structured data.
- condition: When the system executes or validates consistency behavior that falls under structured vs visual consistency.
- expected_behavior: The system enforces structured vs visual consistency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Structured vs Visual Consistency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Structured vs Visual Consistency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-013
CATEGORY: DOC
TITLE: Delivery / Optional Section Conditional Display

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Render optional sections only when real data exists.
- rule: Delivery information and optional sections render only when populated.
- condition: When the system executes or validates conditional sections behavior that falls under delivery / optional section conditional display.
- expected_behavior: The system enforces delivery / optional section conditional display consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Delivery / Optional Section Conditional Display is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Delivery / Optional Section Conditional Display is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: DOC-014
CATEGORY: DOC
TITLE: Footer / Header Cleanliness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep printed outputs free from placeholder noise and duplicated labels.
- rule: Headers and footers must not include junk text, duplicated labels, or non-business placeholders.
- condition: When the system executes or validates layout governance behavior that falls under footer / header cleanliness.
- expected_behavior: The system enforces footer / header cleanliness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Footer / Header Cleanliness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Footer / Header Cleanliness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-001
CATEGORY: FRM
TITLE: Inline Validation

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Expose validation feedback close to the field interaction point.
- rule: Forms must support inline validation.
- condition: When the system executes or validates validation ux behavior that falls under inline validation.
- expected_behavior: The system enforces inline validation consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Inline Validation is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Inline Validation is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-002
CATEGORY: FRM
TITLE: Required Field Visibility

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Make required data obvious before submission fails.
- rule: Required fields must be visibly marked before submission.
- condition: When the system executes or validates validation ux behavior that falls under required field visibility.
- expected_behavior: The system enforces required field visibility consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Required Field Visibility is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Required Field Visibility is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-003
CATEGORY: FRM
TITLE: Clear Error Message Standard

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure validation failures tell the user what to fix.
- rule: Error messages must be clear, actionable, and contextual.
- condition: When the system executes or validates validation ux behavior that falls under clear error message standard.
- expected_behavior: The system enforces clear error message standard consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Clear Error Message Standard is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Clear Error Message Standard is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-004
CATEGORY: FRM
TITLE: Explicit Save Behavior

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Show operators when business data was actually saved.
- rule: Save behavior must provide explicit persistence confirmation.
- condition: When the system executes or validates persistence ux behavior that falls under explicit save behavior.
- expected_behavior: The system enforces explicit save behavior consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Explicit Save Behavior is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Explicit Save Behavior is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-005
CATEGORY: FRM
TITLE: Draft Behavior Standard

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Distinguish draft state from final saved state where draft workflows exist.
- rule: Forms must support and communicate draft behavior where applicable.
- condition: When the system executes or validates persistence ux behavior that falls under draft behavior standard.
- expected_behavior: The system enforces draft behavior standard consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Draft Behavior Standard is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Draft Behavior Standard is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-006
CATEGORY: FRM
TITLE: Critical Action Confirmation

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prevent irreversible actions from firing without explicit operator intent.
- rule: Critical actions must require confirmation.
- condition: When the system executes or validates risk control behavior that falls under critical action confirmation.
- expected_behavior: The system enforces critical action confirmation consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Critical Action Confirmation is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Critical Action Confirmation is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-007
CATEGORY: FRM
TITLE: Register Filtering Capability

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Support operational narrowing of large business registers.
- rule: Registers must support filtering.
- condition: When the system executes or validates register use behavior that falls under register filtering capability.
- expected_behavior: The system enforces register filtering capability consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Register Filtering Capability is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Register Filtering Capability is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-008
CATEGORY: FRM
TITLE: Multi-Parameter Filter Readiness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare list views for compound operational queries.
- rule: Registers must be ready for multi-parameter filtering.
- condition: When the system executes or validates register use behavior that falls under multi-parameter filter readiness.
- expected_behavior: The system enforces multi-parameter filter readiness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Multi-Parameter Filter Readiness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Multi-Parameter Filter Readiness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-009
CATEGORY: FRM
TITLE: Column Customization Readiness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare high-volume registers for role-specific information views.
- rule: Registers must be ready for column customization.
- condition: When the system executes or validates register use behavior that falls under column customization readiness.
- expected_behavior: The system enforces column customization readiness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Column Customization Readiness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Column Customization Readiness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-010
CATEGORY: FRM
TITLE: Drill-Down to Object Page

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Allow operators to move from list context into object detail context.
- rule: Registers must support drill-down to the object page.
- condition: When the system executes or validates register use behavior that falls under drill-down to object page.
- expected_behavior: The system enforces drill-down to object page consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Drill-Down to Object Page is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Drill-Down to Object Page is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-011
CATEGORY: FRM
TITLE: Unsaved Change Protection

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Protect operators from losing in-progress work.
- rule: Forms must protect against silent loss of unsaved critical changes.
- condition: When the system executes or validates persistence ux behavior that falls under unsaved change protection.
- expected_behavior: The system enforces unsaved change protection consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Unsaved Change Protection is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Unsaved Change Protection is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: FRM-012
CATEGORY: FRM
TITLE: Form Submission Blocking on Invalid Critical Data

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure invalid critical data cannot be persisted through the primary submission path.
- rule: Form submission must block on invalid critical data.
- condition: When the system executes or validates validation ux behavior that falls under form submission blocking on invalid critical data.
- expected_behavior: The system enforces form submission blocking on invalid critical data consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Form Submission Blocking on Invalid Critical Data is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Form Submission Blocking on Invalid Critical Data is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-001
CATEGORY: INV
TITLE: Stock Availability Validation

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Block issues and shipments that exceed approved stock availability.
- rule: Issue, sale, or shipment cannot exceed permitted stock unless approved exception flow exists.
- condition: When the system executes or validates stock integrity behavior that falls under stock availability validation.
- expected_behavior: The system enforces stock availability validation consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Stock Availability Validation is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Stock Availability Validation is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-002
CATEGORY: INV
TITLE: Negative Stock Disabled by Default

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Make safe inventory behavior the default operating mode.
- rule: Negative stock must default to disallowed state.
- condition: When the system executes or validates stock governance behavior that falls under negative stock disabled by default.
- expected_behavior: The system enforces negative stock disabled by default consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Negative Stock Disabled by Default is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Negative Stock Disabled by Default is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-003
CATEGORY: INV
TITLE: Negative Stock Exception Governance

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure exception-based negative stock use is explicit and reviewable.
- rule: If negative stock is enabled, the event must be explicitly flagged and auditable.
- condition: When the system executes or validates stock governance behavior that falls under negative stock exception governance.
- expected_behavior: The system enforces negative stock exception governance consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Negative Stock Exception Governance is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Negative Stock Exception Governance is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-004
CATEGORY: INV
TITLE: Backdated Reposting Correction

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Correct historical valuation effects when late receipts change prior negative stock outcomes.
- rule: Late purchase entries must trigger valuation correction logic for previous negative stock effects.
- condition: When the system executes or validates valuation correction behavior that falls under backdated reposting correction.
- expected_behavior: The system enforces backdated reposting correction consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Backdated Reposting Correction is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Backdated Reposting Correction is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-005
CATEGORY: INV
TITLE: FIFO Valuation Enforcement

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep inventory valuation aligned to FIFO as the core standard.
- rule: Inventory valuation must support FIFO as a core standard.
- condition: When the system executes or validates valuation behavior that falls under fifo valuation enforcement.
- expected_behavior: The system enforces fifo valuation enforcement consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: FIFO Valuation Enforcement is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: FIFO Valuation Enforcement is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-006
CATEGORY: INV
TITLE: COGS Linkage

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure every sale-related stock-out produces auditable cost-of-goods movement.
- rule: Every stock-out affecting sale must produce linked cost movement to COGS.
- condition: When the system executes or validates costing behavior that falls under cogs linkage.
- expected_behavior: The system enforces cogs linkage consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: COGS Linkage is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: COGS Linkage is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-007
CATEGORY: INV
TITLE: Inventory-to-Accounting Synchronization

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep stock movement and financial impact aligned across modules.
- rule: Inventory asset, COGS, adjustment, and stock movement must reconcile with the accounting engine.
- condition: When the system executes or validates synchronization behavior that falls under inventory-to-accounting synchronization.
- expected_behavior: The system enforces inventory-to-accounting synchronization consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Inventory-to-Accounting Synchronization is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Inventory-to-Accounting Synchronization is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-008
CATEGORY: INV
TITLE: Lot Traceability

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Preserve batch lineage for operational and regulatory review.
- rule: Stock must support lot and batch lineage.
- condition: When the system executes or validates traceability behavior that falls under lot traceability.
- expected_behavior: The system enforces lot traceability consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Lot Traceability is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Lot Traceability is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-009
CATEGORY: INV
TITLE: Bin / Location Traceability

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Maintain location history for warehouse accountability.
- rule: Stock movements must preserve warehouse, bin, and location history.
- condition: When the system executes or validates traceability behavior that falls under bin / location traceability.
- expected_behavior: The system enforces bin / location traceability consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Bin / Location Traceability is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Bin / Location Traceability is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-010
CATEGORY: INV
TITLE: ABC Classification Support

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Support operational prioritization of inventory review and replenishment.
- rule: Items must support ABC categorization metadata.
- condition: When the system executes or validates inventory planning behavior that falls under abc classification support.
- expected_behavior: The system enforces abc classification support consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: ABC Classification Support is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: ABC Classification Support is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-011
CATEGORY: INV
TITLE: Cycle Count Support

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Allow periodic stock counts without full warehouse shutdown.
- rule: System must support periodic partial stock counts without full operational shutdown.
- condition: When the system executes or validates inventory counting behavior that falls under cycle count support.
- expected_behavior: The system enforces cycle count support consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Cycle Count Support is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Cycle Count Support is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-012
CATEGORY: INV
TITLE: Safety Stock Threshold

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Enable minimum-stock governance before stock-outs occur.
- rule: Reorder and alert logic must support minimum stock buffer.
- condition: When the system executes or validates inventory planning behavior that falls under safety stock threshold.
- expected_behavior: The system enforces safety stock threshold consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Safety Stock Threshold is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Safety Stock Threshold is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-013
CATEGORY: INV
TITLE: Reorder Point Governance

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep reorder thresholds configurable and traceable.
- rule: Reorder thresholds must be configurable and traceable.
- condition: When the system executes or validates inventory planning behavior that falls under reorder point governance.
- expected_behavior: The system enforces reorder point governance consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Reorder Point Governance is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Reorder Point Governance is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-014
CATEGORY: INV
TITLE: Valuation Mismatch Detection

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Flag quantity-value mismatches before they distort inventory reporting.
- rule: System must flag mismatch between stock quantity and stock valuation integrity.
- condition: When the system executes or validates valuation integrity behavior that falls under valuation mismatch detection.
- expected_behavior: The system enforces valuation mismatch detection consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Valuation Mismatch Detection is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Valuation Mismatch Detection is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: INV-015
CATEGORY: INV
TITLE: Inventory Adjustment Traceability

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure manual inventory changes remain accountable when financial impact exists.
- rule: Manual adjustments must require reason, user, timestamp, and accounting linkage when financial impact exists.
- condition: When the system executes or validates adjustment governance behavior that falls under inventory adjustment traceability.
- expected_behavior: The system enforces inventory adjustment traceability consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Inventory Adjustment Traceability is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Inventory Adjustment Traceability is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-001
CATEGORY: SEC
TITLE: Tenant Resource Ownership Check

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure records belong to the tenant context that is attempting access.
- rule: Every protected resource access must verify tenant resource ownership.
- condition: When the system executes or validates tenant isolation behavior that falls under tenant resource ownership check.
- expected_behavior: The system enforces tenant resource ownership check consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Tenant Resource Ownership Check is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Tenant Resource Ownership Check is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-002
CATEGORY: SEC
TITLE: User Belongs to Tenant Check

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure the acting user is attached to the tenant context they are using.
- rule: Every protected action must verify that the user belongs to the active tenant.
- condition: When the system executes or validates tenant isolation behavior that falls under user belongs to tenant check.
- expected_behavior: The system enforces user belongs to tenant check consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: User Belongs to Tenant Check is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: User Belongs to Tenant Check is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-003
CATEGORY: SEC
TITLE: Role Allows Action Check

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure role and permission checks complete the triple-check isolation rule.
- rule: Every protected action must verify the active role allows the requested action.
- condition: When the system executes or validates tenant isolation behavior that falls under role allows action check.
- expected_behavior: The system enforces role allows action check consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Role Allows Action Check is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Role Allows Action Check is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-004
CATEGORY: SEC
TITLE: Cross-Tenant Leak Prevention

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prevent accidental or unauthorized data exposure across tenant boundaries.
- rule: System must prevent cross-tenant data leaks in reads, writes, exports, and logs.
- condition: When the system executes or validates tenant isolation behavior that falls under cross-tenant leak prevention.
- expected_behavior: The system enforces cross-tenant leak prevention consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Cross-Tenant Leak Prevention is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Cross-Tenant Leak Prevention is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-005
CATEGORY: SEC
TITLE: RBAC Enforcement

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure roles and permissions are actually enforced, not just documented.
- rule: System must enforce role-based access control across protected actions.
- condition: When the system executes or validates access control behavior that falls under rbac enforcement.
- expected_behavior: The system enforces rbac enforcement consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: RBAC Enforcement is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: RBAC Enforcement is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-006
CATEGORY: SEC
TITLE: Sensitive Action Logging

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep critical business and security actions auditable.
- rule: Sensitive actions must be logged.
- condition: When the system executes or validates audit logging behavior that falls under sensitive action logging.
- expected_behavior: The system enforces sensitive action logging consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Sensitive Action Logging is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Sensitive Action Logging is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-007
CATEGORY: SEC
TITLE: Audit Log User Identity

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure audit entries identify the acting user.
- rule: Audit logs must store the acting user identity.
- condition: When the system executes or validates audit logging behavior that falls under audit log user identity.
- expected_behavior: The system enforces audit log user identity consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Audit Log User Identity is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Audit Log User Identity is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-008
CATEGORY: SEC
TITLE: Audit Log Timestamp

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure audit entries carry event timing for review and sequencing.
- rule: Audit logs must store event timestamp.
- condition: When the system executes or validates audit logging behavior that falls under audit log timestamp.
- expected_behavior: The system enforces audit log timestamp consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Audit Log Timestamp is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Audit Log Timestamp is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-009
CATEGORY: SEC
TITLE: Audit Log IP Capture

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare audit logging for network-origin traceability.
- rule: Audit logs must capture IP information where applicable.
- condition: When the system executes or validates audit logging behavior that falls under audit log ip capture.
- expected_behavior: The system enforces audit log ip capture consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Audit Log IP Capture is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Audit Log IP Capture is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-010
CATEGORY: SEC
TITLE: Audit Log Immutability

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prevent audit history from being silently rewritten.
- rule: Audit logs must be immutable once committed.
- condition: When the system executes or validates audit logging behavior that falls under audit log immutability.
- expected_behavior: The system enforces audit log immutability consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Audit Log Immutability is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Audit Log Immutability is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-011
CATEGORY: SEC
TITLE: 90-Day Hot Retention

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare recent audit data for rapid operational access.
- rule: Audit retention must support at least 90 days of hot-access storage.
- condition: When the system executes or validates retention behavior that falls under 90-day hot retention.
- expected_behavior: The system enforces 90-day hot retention consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: 90-Day Hot Retention is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: 90-Day Hot Retention is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-012
CATEGORY: SEC
TITLE: Long-Term Archive Retention

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare long-term audit storage beyond the hot window.
- rule: Audit retention must support long-term archived storage.
- condition: When the system executes or validates retention behavior that falls under long-term archive retention.
- expected_behavior: The system enforces long-term archive retention consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Long-Term Archive Retention is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Long-Term Archive Retention is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-013
CATEGORY: SEC
TITLE: Process Abort Logging

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure failed or aborted sensitive processes are visible for review.
- rule: Sensitive or regulated process aborts must be logged.
- condition: When the system executes or validates failure evidence behavior that falls under process abort logging.
- expected_behavior: The system enforces process abort logging consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Process Abort Logging is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Process Abort Logging is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-014
CATEGORY: SEC
TITLE: Audit Readiness Reviewability

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Make audit evidence retrievable for later regulator or auditor review.
- rule: Audit evidence must be reviewable in a structured way.
- condition: When the system executes or validates audit review behavior that falls under audit readiness reviewability.
- expected_behavior: The system enforces audit readiness reviewability consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Audit Readiness Reviewability is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Audit Readiness Reviewability is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: SEC-015
CATEGORY: SEC
TITLE: Security Evidence Traceability

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure security evidence remains linked to the relevant action or record.
- rule: Security evidence must remain traceable to the protected action or object.
- condition: When the system executes or validates audit review behavior that falls under security evidence traceability.
- expected_behavior: The system enforces security evidence traceability consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Security Evidence Traceability is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Security Evidence Traceability is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-001
CATEGORY: TMP
TITLE: WYSIWYG Requirement

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep template editing aligned with visible business output.
- rule: Template engine must support WYSIWYG editing for business users.
- condition: When the system executes or validates editor standards behavior that falls under wysiwyg requirement.
- expected_behavior: The system enforces wysiwyg requirement consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: WYSIWYG Requirement is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: WYSIWYG Requirement is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-002
CATEGORY: TMP
TITLE: Real-Time Preview Parity

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure template preview reflects the current draft state.
- rule: Template engine must provide real-time preview parity with current template state.
- condition: When the system executes or validates preview standards behavior that falls under real-time preview parity.
- expected_behavior: The system enforces real-time preview parity consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Real-Time Preview Parity is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Real-Time Preview Parity is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-003
CATEGORY: TMP
TITLE: Drag-and-Drop Layout Readiness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare the engine for controlled drag-and-drop layout composition.
- rule: Template engine must be structurally ready for drag-and-drop layout control.
- condition: When the system executes or validates layout composition behavior that falls under drag-and-drop layout readiness.
- expected_behavior: The system enforces drag-and-drop layout readiness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Drag-and-Drop Layout Readiness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Drag-and-Drop Layout Readiness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-004
CATEGORY: TMP
TITLE: Section-Based Composition

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Compose templates from clear section blocks rather than opaque HTML fragments.
- rule: Template engine must support section-based composition.
- condition: When the system executes or validates layout composition behavior that falls under section-based composition.
- expected_behavior: The system enforces section-based composition consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Section-Based Composition is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Section-Based Composition is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-005
CATEGORY: TMP
TITLE: Row / Column Grid Support

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare templates for deterministic spatial composition.
- rule: Template engine must support row and column grid composition.
- condition: When the system executes or validates layout composition behavior that falls under row / column grid support.
- expected_behavior: The system enforces row / column grid support consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Row / Column Grid Support is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Row / Column Grid Support is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-006
CATEGORY: TMP
TITLE: Conditional Rendering Support

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Allow sections to appear only when relevant business data is present.
- rule: Template engine must support conditional rendering.
- condition: When the system executes or validates conditional rendering behavior that falls under conditional rendering support.
- expected_behavior: The system enforces conditional rendering support consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Conditional Rendering Support is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Conditional Rendering Support is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-007
CATEGORY: TMP
TITLE: Logo Placement Control

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep logo placement explicit and consistent across template variants.
- rule: Template engine must support explicit logo placement control.
- condition: When the system executes or validates brand placement behavior that falls under logo placement control.
- expected_behavior: The system enforces logo placement control consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Logo Placement Control is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Logo Placement Control is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-008
CATEGORY: TMP
TITLE: Stamp Placement Control

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare document designs for controlled stamp positioning.
- rule: Template engine must support explicit stamp placement control.
- condition: When the system executes or validates brand placement behavior that falls under stamp placement control.
- expected_behavior: The system enforces stamp placement control consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Stamp Placement Control is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Stamp Placement Control is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-009
CATEGORY: TMP
TITLE: Signature Placement Control

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare document designs for controlled signature positioning.
- rule: Template engine must support explicit signature placement control.
- condition: When the system executes or validates brand placement behavior that falls under signature placement control.
- expected_behavior: The system enforces signature placement control consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Signature Placement Control is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Signature Placement Control is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-010
CATEGORY: TMP
TITLE: Multi-Template Support

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Allow multiple approved layouts per business document type.
- rule: Template engine must support multiple templates.
- condition: When the system executes or validates template governance behavior that falls under multi-template support.
- expected_behavior: The system enforces multi-template support consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Multi-Template Support is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Multi-Template Support is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-011
CATEGORY: TMP
TITLE: Default Template Governance

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure a controlled default exists for each document context.
- rule: Template engine must support governed default-template behavior.
- condition: When the system executes or validates template governance behavior that falls under default template governance.
- expected_behavior: The system enforces default template governance consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Default Template Governance is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Default Template Governance is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: TMP-012
CATEGORY: TMP
TITLE: PDF Render Consistency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep final PDF output consistent with approved template structure.
- rule: Template engine must render consistent PDF output from the saved template definition.
- condition: When the system executes or validates rendering integrity behavior that falls under pdf render consistency.
- expected_behavior: The system enforces pdf render consistency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: PDF Render Consistency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: PDF Render Consistency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: UIX-001
CATEGORY: UIX
TITLE: 5-Second Understanding Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure operators can understand the page purpose almost immediately.
- rule: Primary workspace surfaces must communicate purpose and action within five seconds.
- condition: When the system executes or validates comprehension behavior that falls under 5-second understanding rule.
- expected_behavior: The system enforces 5-second understanding rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: 5-Second Understanding Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: 5-Second Understanding Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: UIX-002
CATEGORY: UIX
TITLE: 5-Click Completion Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep common workflows operationally short.
- rule: Common business tasks should complete within five logical clicks when preconditions are satisfied.
- condition: When the system executes or validates task efficiency behavior that falls under 5-click completion rule.
- expected_behavior: The system enforces 5-click completion rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: 5-Click Completion Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: 5-Click Completion Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: UIX-003
CATEGORY: UIX
TITLE: No Dead-End Screens

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Avoid inert screens that leave users without a next action.
- rule: Screens must not become dead ends when blocked, empty, or partially available.
- condition: When the system executes or validates recovery behavior that falls under no dead-end screens.
- expected_behavior: The system enforces no dead-end screens consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: No Dead-End Screens is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: No Dead-End Screens is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: UIX-004
CATEGORY: UIX
TITLE: Breadcrumb Requirement for Deep Paths

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Expose route context for deeper operational paths.
- rule: Deep routes must expose breadcrumb context or equivalent path guidance.
- condition: When the system executes or validates navigation context behavior that falls under breadcrumb requirement for deep paths.
- expected_behavior: The system enforces breadcrumb requirement for deep paths consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Breadcrumb Requirement for Deep Paths is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Breadcrumb Requirement for Deep Paths is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: UIX-005
CATEGORY: UIX
TITLE: Sidebar Hierarchy Standard

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure navigation grouping reflects operational hierarchy.
- rule: Sidebar hierarchy must reflect real module and task grouping.
- condition: When the system executes or validates navigation context behavior that falls under sidebar hierarchy standard.
- expected_behavior: The system enforces sidebar hierarchy standard consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Sidebar Hierarchy Standard is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Sidebar Hierarchy Standard is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: UIX-006
CATEGORY: UIX
TITLE: Dense Data Table Standard

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Support operator scanning in data-heavy accounting workflows.
- rule: Dense business tables must remain information-rich and scan-friendly.
- condition: When the system executes or validates operational density behavior that falls under dense data table standard.
- expected_behavior: The system enforces dense data table standard consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Dense Data Table Standard is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Dense Data Table Standard is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: UIX-007
CATEGORY: UIX
TITLE: Sticky Header Requirement

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep key page context and actions visible during long-page work.
- rule: Operational surfaces must support sticky header context where navigation depth requires it.
- condition: When the system executes or validates navigation context behavior that falls under sticky header requirement.
- expected_behavior: The system enforces sticky header requirement consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Sticky Header Requirement is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Sticky Header Requirement is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: UIX-008
CATEGORY: UIX
TITLE: Empty-State CTA Requirement

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure empty states remain actionable.
- rule: Empty states must include a relevant call to action.
- condition: When the system executes or validates recovery behavior that falls under empty-state cta requirement.
- expected_behavior: The system enforces empty-state cta requirement consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Empty-State CTA Requirement is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Empty-State CTA Requirement is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: UIX-009
CATEGORY: UIX
TITLE: Role-Based UI Visibility

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Align surface visibility to role-based workspace expectations.
- rule: UI visibility must vary correctly by role and permissions.
- condition: When the system executes or validates role experience behavior that falls under role-based ui visibility.
- expected_behavior: The system enforces role-based ui visibility consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Role-Based UI Visibility is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Role-Based UI Visibility is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: UIX-010
CATEGORY: UIX
TITLE: High-Volume Scanning Readiness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep large transaction lists scan-friendly for operators.
- rule: UI must support high-volume scanning of operational lists and states.
- condition: When the system executes or validates operational density behavior that falls under high-volume scanning readiness.
- expected_behavior: The system enforces high-volume scanning readiness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: High-Volume Scanning Readiness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: High-Volume Scanning Readiness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: UIX-011
CATEGORY: UIX
TITLE: Navigation Predictability

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure route behavior remains predictable across workspace movement.
- rule: Navigation patterns must remain predictable across role workspaces and module surfaces.
- condition: When the system executes or validates navigation context behavior that falls under navigation predictability.
- expected_behavior: The system enforces navigation predictability consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Navigation Predictability is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Navigation Predictability is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-001
CATEGORY: VAL
TITLE: KSA VAT Number Format

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure KSA VAT numbers follow format and length expectations.
- rule: KSA VAT number validation must enforce regulated format and length.
- condition: When the system executes or validates identity validation behavior that falls under ksa vat number format.
- expected_behavior: The system enforces ksa vat number format consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: KSA VAT Number Format is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: KSA VAT Number Format is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-002
CATEGORY: VAL
TITLE: EU VAT Number Readiness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare the validation layer for EU VAT registration structures.
- rule: Validation layer must be ready to support EU VAT number patterns.
- condition: When the system executes or validates identity validation behavior that falls under eu vat number readiness.
- expected_behavior: The system enforces eu vat number readiness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: EU VAT Number Readiness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: EU VAT Number Readiness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-003
CATEGORY: VAL
TITLE: CR Number Numeric / Length Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure commercial registration values are structurally valid.
- rule: CR number validation must enforce numeric content and expected length.
- condition: When the system executes or validates identity validation behavior that falls under cr number numeric / length rule.
- expected_behavior: The system enforces cr number numeric / length rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: CR Number Numeric / Length Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: CR Number Numeric / Length Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-004
CATEGORY: VAL
TITLE: Phone Number Structure

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure phone inputs follow a defined structure.
- rule: Phone number validation must enforce basic structural correctness.
- condition: When the system executes or validates contact validation behavior that falls under phone number structure.
- expected_behavior: The system enforces phone number structure consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Phone Number Structure is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Phone Number Structure is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-005
CATEGORY: VAL
TITLE: Country-Aware Phone Validation

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare validation logic for country-specific phone expectations.
- rule: Phone validation must support country-aware rules.
- condition: When the system executes or validates contact validation behavior that falls under country-aware phone validation.
- expected_behavior: The system enforces country-aware phone validation consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Country-Aware Phone Validation is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Country-Aware Phone Validation is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-006
CATEGORY: VAL
TITLE: Email Structure Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure email inputs follow a valid structure.
- rule: Email validation must enforce valid email structure.
- condition: When the system executes or validates contact validation behavior that falls under email structure rule.
- expected_behavior: The system enforces email structure rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Email Structure Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Email Structure Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-007
CATEGORY: VAL
TITLE: Postal Code Format

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure postal code inputs follow an expected structural rule.
- rule: Postal code validation must enforce configured format.
- condition: When the system executes or validates address validation behavior that falls under postal code format.
- expected_behavior: The system enforces postal code format consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Postal Code Format is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Postal Code Format is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-008
CATEGORY: VAL
TITLE: PO Box Format

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure PO Box inputs follow a recognizable structure.
- rule: PO Box validation must enforce supported structure.
- condition: When the system executes or validates address validation behavior that falls under po box format.
- expected_behavior: The system enforces po box format consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: PO Box Format is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: PO Box Format is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-009
CATEGORY: VAL
TITLE: Address Line Structured Fields

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prevent business address data from collapsing into a single opaque free-text field.
- rule: Address capture must support structured address-line fields.
- condition: When the system executes or validates address validation behavior that falls under address line structured fields.
- expected_behavior: The system enforces address line structured fields consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Address Line Structured Fields is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Address Line Structured Fields is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-010
CATEGORY: VAL
TITLE: City / Region / Country Completeness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure core location components remain complete for business identity and tax logic.
- rule: Address validation must ensure city, region where applicable, and country completeness.
- condition: When the system executes or validates address validation behavior that falls under city / region / country completeness.
- expected_behavior: The system enforces city / region / country completeness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: City / Region / Country Completeness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: City / Region / Country Completeness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-011
CATEGORY: VAL
TITLE: Fax Format Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure fax inputs, when used, follow an expected structure.
- rule: Fax validation must enforce supported format.
- condition: When the system executes or validates contact validation behavior that falls under fax format rule.
- expected_behavior: The system enforces fax format rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Fax Format Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Fax Format Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-012
CATEGORY: VAL
TITLE: Currency Code Validity

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure currency identifiers remain standard-compliant.
- rule: Currency code validation must enforce valid currency identifiers.
- condition: When the system executes or validates financial validation behavior that falls under currency code validity.
- expected_behavior: The system enforces currency code validity consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Currency Code Validity is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Currency Code Validity is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-013
CATEGORY: VAL
TITLE: Date Format Validity

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure date inputs remain machine and business valid.
- rule: Date validation must enforce valid date structure and parseability.
- condition: When the system executes or validates financial validation behavior that falls under date format validity.
- expected_behavior: The system enforces date format validity consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Date Format Validity is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Date Format Validity is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-014
CATEGORY: VAL
TITLE: Amount Precision Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure monetary fields keep controlled precision.
- rule: Amount validation must enforce supported precision rules.
- condition: When the system executes or validates financial validation behavior that falls under amount precision rule.
- expected_behavior: The system enforces amount precision rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Amount Precision Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Amount Precision Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-015
CATEGORY: VAL
TITLE: Quantity Precision Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure quantity fields keep controlled precision.
- rule: Quantity validation must enforce supported precision rules.
- condition: When the system executes or validates financial validation behavior that falls under quantity precision rule.
- expected_behavior: The system enforces quantity precision rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Quantity Precision Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Quantity Precision Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-016
CATEGORY: VAL
TITLE: Comma Grouping / Number Presentation Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep visible numeric formatting readable and predictable.
- rule: Number presentation rules must support readable grouping without altering stored numeric truth.
- condition: When the system executes or validates presentation validation behavior that falls under comma grouping / number presentation rule.
- expected_behavior: The system enforces comma grouping / number presentation rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Comma Grouping / Number Presentation Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Comma Grouping / Number Presentation Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-017
CATEGORY: VAL
TITLE: Inline Guidance Requirement

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure users receive format guidance before they hit preventable validation errors.
- rule: Relevant validation fields must expose inline guidance where structure is not obvious.
- condition: When the system executes or validates validation ux behavior that falls under inline guidance requirement.
- expected_behavior: The system enforces inline guidance requirement consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Inline Guidance Requirement is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Inline Guidance Requirement is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAL-018
CATEGORY: VAL
TITLE: Submission Blocking Rule

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure critical invalid data cannot pass through save or submit flows.
- rule: Submission must block when critical validation rules fail.
- condition: When the system executes or validates validation ux behavior that falls under submission blocking rule.
- expected_behavior: The system enforces submission blocking rule consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Submission Blocking Rule is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Submission Blocking Rule is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-001
CATEGORY: VAT
TITLE: Output VAT Separation

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep output tax distinct from net sales value.
- rule: Output VAT must be recorded separately from net sales values.
- condition: When the system executes or validates tax separation behavior that falls under output vat separation.
- expected_behavior: The system enforces output vat separation consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Output VAT Separation is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Output VAT Separation is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-002
CATEGORY: VAT
TITLE: Input VAT Separation

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep recoverable purchase tax distinct from purchase net values.
- rule: Input VAT must be recorded separately from net purchase and expense values.
- condition: When the system executes or validates tax separation behavior that falls under input vat separation.
- expected_behavior: The system enforces input vat separation consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Input VAT Separation is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Input VAT Separation is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-003
CATEGORY: VAT
TITLE: VAT Payable Formula

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure VAT liability can be reviewed from source components.
- rule: VAT payable must be calculable as output VAT minus recoverable input VAT.
- condition: When the system executes or validates tax calculation behavior that falls under vat payable formula.
- expected_behavior: The system enforces vat payable formula consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: VAT Payable Formula is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: VAT Payable Formula is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-004
CATEGORY: VAT
TITLE: Customer Origin Capture Dependency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Make tax decisions depend on customer origin where required by regime logic.
- rule: Tax decision engine must depend on customer origin data when relevant.
- condition: When the system executes or validates tax decision engine behavior that falls under customer origin capture dependency.
- expected_behavior: The system enforces customer origin capture dependency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Customer Origin Capture Dependency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Customer Origin Capture Dependency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-005
CATEGORY: VAT
TITLE: Supply Location Dependency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Apply place-of-supply logic consistently.
- rule: Tax treatment must depend on place and supply-location rules.
- condition: When the system executes or validates tax decision engine behavior that falls under supply location dependency.
- expected_behavior: The system enforces supply location dependency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Supply Location Dependency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Supply Location Dependency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-006
CATEGORY: VAT
TITLE: Customer VAT Status Dependency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Use customer registration status when determining tax treatment.
- rule: Tax decision engine must use customer VAT registration status.
- condition: When the system executes or validates tax decision engine behavior that falls under customer vat status dependency.
- expected_behavior: The system enforces customer vat status dependency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Customer VAT Status Dependency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Customer VAT Status Dependency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-007
CATEGORY: VAT
TITLE: B2B vs B2C Differentiation

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure business and consumer tax treatment diverge when regulation requires it.
- rule: VAT path must differ correctly for B2B versus B2C where applicable.
- condition: When the system executes or validates tax decision engine behavior that falls under b2b vs b2c differentiation.
- expected_behavior: The system enforces b2b vs b2c differentiation consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: B2B vs B2C Differentiation is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: B2B vs B2C Differentiation is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-008
CATEGORY: VAT
TITLE: Reverse Charge Eligibility

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Support reverse-charge treatment for qualifying services.
- rule: Reverse charge logic must be supported for qualifying cross-border B2B services.
- condition: When the system executes or validates cross-border tax behavior that falls under reverse charge eligibility.
- expected_behavior: The system enforces reverse charge eligibility consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Reverse Charge Eligibility is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Reverse Charge Eligibility is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-009
CATEGORY: VAT
TITLE: Reverse Charge Labeling

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep reverse-charge treatment visible in both machine and human-readable outputs.
- rule: Reverse charge treatment must appear correctly in structured data and visible output where required.
- condition: When the system executes or validates cross-border tax behavior that falls under reverse charge labeling.
- expected_behavior: The system enforces reverse charge labeling consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Reverse Charge Labeling is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Reverse Charge Labeling is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-010
CATEGORY: VAT
TITLE: KSA XML Generation Readiness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare invoice compliance for KSA XML generation.
- rule: KSA invoice compliance structure must support XML generation.
- condition: When the system executes or validates ksa e-invoicing behavior that falls under ksa xml generation readiness.
- expected_behavior: The system enforces ksa xml generation readiness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: KSA XML Generation Readiness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: KSA XML Generation Readiness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-011
CATEGORY: VAT
TITLE: KSA PDF/A-3 Readiness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare the document pipeline for compliant hybrid PDF output.
- rule: Compliant invoice pipeline must support PDF/A-3 with embedded XML.
- condition: When the system executes or validates ksa e-invoicing behavior that falls under ksa pdf/a-3 readiness.
- expected_behavior: The system enforces ksa pdf/a-3 readiness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: KSA PDF/A-3 Readiness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: KSA PDF/A-3 Readiness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-012
CATEGORY: VAT
TITLE: SHA-256 Hash Requirement

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare compliance hashing for invoice payload integrity.
- rule: Compliance pipeline must support invoice hash generation.
- condition: When the system executes or validates ksa e-invoicing behavior that falls under sha-256 hash requirement.
- expected_behavior: The system enforces sha-256 hash requirement consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: SHA-256 Hash Requirement is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: SHA-256 Hash Requirement is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-013
CATEGORY: VAT
TITLE: ECDSA Signature Requirement

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare compliance signing capability for regulated invoice exchange.
- rule: Compliance pipeline must support signature metadata and signature step.
- condition: When the system executes or validates ksa e-invoicing behavior that falls under ecdsa signature requirement.
- expected_behavior: The system enforces ecdsa signature requirement consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: ECDSA Signature Requirement is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: ECDSA Signature Requirement is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-014
CATEGORY: VAT
TITLE: QR TLV Tag 1 Seller Name

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure seller-name TLV support exists in the compliance payload.
- rule: QR TLV output must support Tag 1 for seller name.
- condition: When the system executes or validates ksa qr tlv behavior that falls under qr tlv tag 1 seller name.
- expected_behavior: The system enforces qr tlv tag 1 seller name consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: QR TLV Tag 1 Seller Name is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: QR TLV Tag 1 Seller Name is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-015
CATEGORY: VAT
TITLE: QR TLV Tag 2 VAT Number

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure VAT-number TLV support exists in the compliance payload.
- rule: QR TLV output must support Tag 2 for VAT number.
- condition: When the system executes or validates ksa qr tlv behavior that falls under qr tlv tag 2 vat number.
- expected_behavior: The system enforces qr tlv tag 2 vat number consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: QR TLV Tag 2 VAT Number is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: QR TLV Tag 2 VAT Number is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-016
CATEGORY: VAT
TITLE: QR TLV Tag 3 Timestamp

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure timestamp TLV support exists in the compliance payload.
- rule: QR TLV output must support Tag 3 for invoice timestamp.
- condition: When the system executes or validates ksa qr tlv behavior that falls under qr tlv tag 3 timestamp.
- expected_behavior: The system enforces qr tlv tag 3 timestamp consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: QR TLV Tag 3 Timestamp is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: QR TLV Tag 3 Timestamp is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-017
CATEGORY: VAT
TITLE: QR TLV Tag 4 Invoice Total

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure invoice-total TLV support exists in the compliance payload.
- rule: QR TLV output must support Tag 4 for invoice total.
- condition: When the system executes or validates ksa qr tlv behavior that falls under qr tlv tag 4 invoice total.
- expected_behavior: The system enforces qr tlv tag 4 invoice total consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: QR TLV Tag 4 Invoice Total is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: QR TLV Tag 4 Invoice Total is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-018
CATEGORY: VAT
TITLE: QR TLV Tag 5 VAT Total

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure VAT-total TLV support exists in the compliance payload.
- rule: QR TLV output must support Tag 5 for VAT total.
- condition: When the system executes or validates ksa qr tlv behavior that falls under qr tlv tag 5 vat total.
- expected_behavior: The system enforces qr tlv tag 5 vat total consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: QR TLV Tag 5 VAT Total is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: QR TLV Tag 5 VAT Total is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-019
CATEGORY: VAT
TITLE: QR TLV Tag 6 XML Hash

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure XML-hash TLV support exists in the compliance payload.
- rule: QR TLV output must support Tag 6 for XML hash.
- condition: When the system executes or validates ksa qr tlv behavior that falls under qr tlv tag 6 xml hash.
- expected_behavior: The system enforces qr tlv tag 6 xml hash consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: QR TLV Tag 6 XML Hash is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: QR TLV Tag 6 XML Hash is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-020
CATEGORY: VAT
TITLE: QR TLV Tag 7 ECDSA Signature

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure signature TLV support exists in the compliance payload.
- rule: QR TLV output must support Tag 7 for ECDSA signature.
- condition: When the system executes or validates ksa qr tlv behavior that falls under qr tlv tag 7 ecdsa signature.
- expected_behavior: The system enforces qr tlv tag 7 ecdsa signature consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: QR TLV Tag 7 ECDSA Signature is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: QR TLV Tag 7 ECDSA Signature is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-021
CATEGORY: VAT
TITLE: QR TLV Tag 8 Public Key

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure public-key TLV support exists in the compliance payload.
- rule: QR TLV output must support Tag 8 for public key.
- condition: When the system executes or validates ksa qr tlv behavior that falls under qr tlv tag 8 public key.
- expected_behavior: The system enforces qr tlv tag 8 public key consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: QR TLV Tag 8 Public Key is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: QR TLV Tag 8 Public Key is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-022
CATEGORY: VAT
TITLE: QR TLV Tag 9 Stamp / Cryptographic Stamp

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure stamp TLV support exists in the compliance payload.
- rule: QR TLV output must support Tag 9 for stamp or cryptographic stamp.
- condition: When the system executes or validates ksa qr tlv behavior that falls under qr tlv tag 9 stamp / cryptographic stamp.
- expected_behavior: The system enforces qr tlv tag 9 stamp / cryptographic stamp consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: QR TLV Tag 9 Stamp / Cryptographic Stamp is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: QR TLV Tag 9 Stamp / Cryptographic Stamp is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-023
CATEGORY: VAT
TITLE: EN 16931 Semantic Mapping

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prepare invoice structured data for EU semantic interoperability.
- rule: Invoice structured data must support EU semantic field mapping under EN 16931.
- condition: When the system executes or validates eu e-invoicing behavior that falls under en 16931 semantic mapping.
- expected_behavior: The system enforces en 16931 semantic mapping consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: EN 16931 Semantic Mapping is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: EN 16931 Semantic Mapping is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: VAT-024
CATEGORY: VAT
TITLE: Structured Tax Data Completeness

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep tax-critical fields available in machine-readable form for downstream compliance use.
- rule: Tax-critical fields must exist in machine-readable structure, not only visual PDF text.
- condition: When the system executes or validates structured tax data behavior that falls under structured tax data completeness.
- expected_behavior: The system enforces structured tax data completeness consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Structured Tax Data Completeness is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Structured Tax Data Completeness is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: XMD-001
CATEGORY: XMD
TITLE: Invoice-to-Journal Link

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure invoices retain a traceable accounting posting link.
- rule: Every posted invoice must link to its resulting journal.
- condition: When the system executes or validates cross-module traceability behavior that falls under invoice-to-journal link.
- expected_behavior: The system enforces invoice-to-journal link consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Invoice-to-Journal Link is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Invoice-to-Journal Link is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: XMD-002
CATEGORY: XMD
TITLE: Payment-to-Journal Link

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure payment activity remains traceable into accounting.
- rule: Every posted payment must link to its resulting journal.
- condition: When the system executes or validates cross-module traceability behavior that falls under payment-to-journal link.
- expected_behavior: The system enforces payment-to-journal link consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Payment-to-Journal Link is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Payment-to-Journal Link is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: XMD-003
CATEGORY: XMD
TITLE: Inventory-to-COGS-to-Journal Link

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure physical movement, costing, and accounting remain connected.
- rule: Every sale-related inventory movement must link through COGS into journal impact.
- condition: When the system executes or validates cross-module traceability behavior that falls under inventory-to-cogs-to-journal link.
- expected_behavior: The system enforces inventory-to-cogs-to-journal link consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Inventory-to-COGS-to-Journal Link is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Inventory-to-COGS-to-Journal Link is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: XMD-004
CATEGORY: XMD
TITLE: Credit Note Accounting Link

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure credit-note commercial adjustments remain connected to accounting impact.
- rule: Every posted credit note must retain accounting linkage.
- condition: When the system executes or validates cross-module traceability behavior that falls under credit note accounting link.
- expected_behavior: The system enforces credit note accounting link consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Credit Note Accounting Link is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Credit Note Accounting Link is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: XMD-005
CATEGORY: XMD
TITLE: Debit Note Accounting Link

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure debit-note commercial adjustments remain connected to accounting impact.
- rule: Every posted debit note must retain accounting linkage.
- condition: When the system executes or validates cross-module traceability behavior that falls under debit note accounting link.
- expected_behavior: The system enforces debit note accounting link consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Debit Note Accounting Link is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Debit Note Accounting Link is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: XMD-006
CATEGORY: XMD
TITLE: Document Status vs Accounting State Consistency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Prevent documents and accounting state from drifting apart.
- rule: Document status must remain consistent with resulting accounting state.
- condition: When the system executes or validates state consistency behavior that falls under document status vs accounting state consistency.
- expected_behavior: The system enforces document status vs accounting state consistency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Document Status vs Accounting State Consistency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Document Status vs Accounting State Consistency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: XMD-007
CATEGORY: XMD
TITLE: VAT Engine vs Invoice Engine Consistency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure tax decisions and invoice data remain aligned.
- rule: VAT engine output must remain consistent with invoice engine data and presentation.
- condition: When the system executes or validates state consistency behavior that falls under vat engine vs invoice engine consistency.
- expected_behavior: The system enforces vat engine vs invoice engine consistency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: VAT Engine vs Invoice Engine Consistency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: VAT Engine vs Invoice Engine Consistency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: XMD-008
CATEGORY: XMD
TITLE: Customer Master Data Dependency Integrity

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep customer master data dependencies explicit and reliable across modules.
- rule: Customer-dependent flows must use current controlled master data without silent divergence.
- condition: When the system executes or validates master data dependency behavior that falls under customer master data dependency integrity.
- expected_behavior: The system enforces customer master data dependency integrity consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Customer Master Data Dependency Integrity is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Customer Master Data Dependency Integrity is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: XMD-009
CATEGORY: XMD
TITLE: Company Profile Single Source of Truth Dependency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Keep company identity and compliance metadata centralized.
- rule: Dependent modules must source company identity and compliance metadata from the controlled company profile source of truth.
- condition: When the system executes or validates master data dependency behavior that falls under company profile single source of truth dependency.
- expected_behavior: The system enforces company profile single source of truth dependency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Company Profile Single Source of Truth Dependency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Company Profile Single Source of Truth Dependency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? no
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------
--------------------------------------------------
CONTROL POINT ID: XMD-010
CATEGORY: XMD
TITLE: Register / Detail / Print Data Consistency

CANONICAL CANDIDATE SOURCE:
- C:\hisab\lib\master-design-control-points.ts

OTHER OCCURRENCES:
- C:\hisab\backend\app\Support\Standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-point-registry.ts
- C:\hisab\data\standards\control-points.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts
- C:\hisab\backend\app\Support\Standards\control-points-master.ts

DUPLICATE STATUS:
- derived

CONTENT SNAPSHOT:
- purpose: Ensure the same business truth appears in lists, details, and printed outputs.
- rule: Register, detail, and print surfaces must remain consistent for the same record.
- condition: When the system executes or validates state consistency behavior that falls under register / detail / print data consistency.
- expected_behavior: The system enforces register / detail / print data consistency consistently and emits auditable evidence whenever the rule is evaluated.
- pass_criteria: Register / Detail / Print Data Consistency is enforced across the mapped modules and processes with traceable evidence.
- fail_criteria: Register / Detail / Print Data Consistency is missing, bypassed, inconsistent, or cannot be evidenced in the mapped flows.

REVIEW FLAGS:
- missing fields? no
- conflicting wording? no
- likely weak? yes
- likely duplicate only? yes

NOTES:
- occurrences: 8
- source roles present: canonical, compatibility, derived
- missing fields in canonical candidate: none
--------------------------------------------------