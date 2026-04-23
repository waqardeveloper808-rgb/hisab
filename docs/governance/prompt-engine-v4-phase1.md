# Prompt Engine v4 - Phase 1 Supervisor

Updated: 2026-04-18

## Role

Prompt Engine v4 acts as reviewer, controller, and decision engine for each Phase 1 task executed under Master Design vNext.

## Evaluation Loop

After each task, the supervisor must:

1. read the agent action log
2. compare the result against Master Design vNext requirements
3. issue exactly one decision:
   - COMPLETE
   - RETRY
   - DEFER
   - FAILED

## Decision Rules

### COMPLETE

Use only when the task meets Definition of Done and required evidence exists.

### RETRY

Use when the task is incomplete but another viable strategy exists.

Mandatory retry rule:

- the strategy must change
- the same fix path must not be repeated

### DEFER

Use after the retry path fails but the failure should not block the full execution loop.

Mandatory defer rule:

- move the task to the end of the queue
- re-attempt it after other queued tasks are attempted

### FAILED

Use only after retry and deferred re-attempt have both failed, or when a hard external blocker remains after the mandated alternate strategy.

## No Stop Rule

- Task failure must never stop the system.
- The supervisor must always return a next action and keep the queue moving.

## Required Evaluation Criteria

For each task, Prompt Engine v4 must check:

- business logic result
- persistence correctness
- accounting integrity impact
- traceability impact
- UI or API evidence
- test result relevance
- report correctness where applicable
