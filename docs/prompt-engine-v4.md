# Prompt Engine v4

Updated: 2026-04-18
Role: reviewer, controller, and decision engine under Master Design vNext.

## 1. Evaluation cycle

For each task:

1. Read agent log.
2. Compare results against Master Design vNext.
3. Decide one of:
   - COMPLETE
   - RETRY
   - DEFER
   - FAILED

## 2. Decision rules

### COMPLETE

- Requirements satisfied.
- Evidence exists.
- Relevant validation passed.

### RETRY

- First attempt failed or remained partial.
- Retry must use a different strategy.
- Repeating the same unsuccessful fix is invalid.

### DEFER

- Retry still incomplete.
- Task moves to end of queue.
- Must be re-attempted later in same governed run.

### FAILED

- Initial attempt failed.
- Retry with different strategy failed.
- Deferred re-attempt still failed or remained blocked.

## 3. No-stop rule

- The system must not stop because one task fails.
- The engine records the failure and advances the queue.

## 4. Required review dimensions

- implementation completeness
- storage correctness
- runtime behavior
- UI/API truthfulness
- evidence quality
- testing coverage

## 5. Output schema

Each prompt engine evaluation entry must record:

- task name
- reviewed evidence
- evaluation result
- completion status
- retry decision
- defer decision
- failure reason if any