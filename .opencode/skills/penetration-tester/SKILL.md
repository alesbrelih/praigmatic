---
name: penetration-tester
description: |
  Organize and scaffold penetration testing workspaces with mandatory authorization
  gates. Use whenever the user is starting, tracking, or organizing a security
  assessment, pentest, vulnerability analysis, bug bounty investigation, red team
  exercise, API security test, web app security review, infrastructure audit,
  container security scan, cloud security assessment, source code review, security
  research, or any activity involving active testing, reconnaissance, or vulnerability
  discovery against a target system. This skill MUST be consulted
  before creating any test plans, findings, evidence folders, or audit trails.
  Use it even if the user only says "let's test this" or "check if this is secure".
---

# Penetration Tester Workspace

Scaffold and maintain organized pentest workspaces with a mandatory Rules of
Engagement check before any active testing artifacts can be created.

## Core Principle

An **engagement** contains one or more **scopes**. Each scope is a self-contained
assessment with its own authorization document, project context, and numbered
test plans. Scopes within an engagement share a root directory for high-level
coordination.

## Engagement + Scope Structure

### Multi-scope engagement (recommended for real engagements)

```
<engagement-name>/
├── AGENTS.md              ← Engagement overview: scope list, shared constraints
├── <scope1>/
│   ├── ROE.md             ← MANDATORY per scope. Authorization gate.
│   ├── context.md         ← MANDATORY per scope. Business context for verification.
│   ├── AGENTS.md          ← Scope-level: targets, plans, auth for this scope
│   └── plans/
│       └── NN-slug/
│           ├── plan.md
│           ├── evidence/
│           ├── audit/
│           ├── findings/
│           └── notes/
└── <scope2>/
    ├── ROE.md
    ├── context.md
    ├── AGENTS.md
    └── plans/
        └── NN-slug/
            ├── plan.md
            ├── evidence/
            ├── audit/
            ├── findings/
            └── notes/
```

### Standalone scope (single-scope assessment)

For single-scope work, the scope directory can sit at the root level without
an engagement wrapper:

```
<scope-name>/
├── ROE.md              ← MANDATORY. Authorization gate.
├── context.md          ← MANDATORY. Business context for verification.
├── AGENTS.md           ← Scope-level context (same as above)
└── plans/
    └── NN-slug/
        ├── plan.md
        ├── evidence/
        ├── audit/
        ├── findings/
        └── notes/
```

## When to Use Engagement Root

Always create an engagement root when:
- The user mentions multiple targets (e.g., "API and mobile app")
- The assessment has distinct phases with different authorization boundaries
- The project involves companion apps, hardware, or multiple subsystems
- You are continuing work within an existing engagement directory

Use standalone scope mode only when the user explicitly wants a single,
self-contained assessment with no broader context.

## Engagement-Level AGENTS.md

The engagement root `AGENTS.md` tracks cross-scope coordination. Create from
`references/engagement-agents-template.md`.

**Contains:**
- Engagement metadata (client, dates, engagement ID)
- Scope list with status and links
- Cross-scope dependencies and shared constraints
- High-level findings that span multiple scopes

**Does NOT contain:**
- Plan-level detail (lives in scope AGENTS.md)
- Target specifics (lives in scope AGENTS.md)
- Auth credentials (lives in scope AGENTS.md)

## Scope-Level AGENTS.md

Each scope has its own `AGENTS.md` for scope-specific context. Create from
`references/agents-template.md`.

**Contains:**
- Constraints specific to this scope
- Active plans table for this scope only
- Target inventory for this scope
- Auth/access mechanisms for this scope
- Key findings summary for this scope
- Related work and cross-references

## Hard Gate: ROE Check

Before creating ANY plan directory, evidence file, audit log, finding, or note,
you MUST verify that `ROE.md` exists in the target scope directory.

### If ROE.md is missing:

1. **STOP.** Do not create any plans, findings, evidence, or audit artifacts.
2. Create `<scope-name>/ROE.md` from `references/roe-template.md`.
3. Explain to the user: *"I cannot create test plans without an explicit Rules
   of Engagement document. This is a safety guardrail to prevent unauthorized
   testing. I have created a template at `<scope-name>/ROE.md`. Please fill in
   the scope boundaries and confirm authorization. Once this file exists, I
   will proceed with plan scaffolding."*
4. Wait for the user to confirm or update the ROE before continuing.

### If ROE.md exists:

1. Proceed with plan scaffolding or any other workspace operations.
2. Reference the ROE silently — do not show its contents unless requested.

### Additional safety rules:

- Do not create plans outside an existing scope directory.
- Do not assume scope boundaries — the ROE is the single source of truth for
  what is in scope and what is not.
- If a user asks to test something not mentioned in ROE, point to the gap and
  ask for an ROE update.

## Hard Gate: Business Context Check

Before creating ANY plan directory, you MUST verify that `context.md` exists
in the target scope directory and is filled in.

Business context is essential for finding verification. The `/verify-finding`
and `/verify-next` commands will refuse to proceed without it. Capturing it
during scaffolding avoids repetitive prompting later.

### If context.md is missing:

1. **STOP.** Do not create any plans yet.
2. Create `<scope-name>/context.md` from `references/context-template.md`.
3. Explain to the user: *"I cannot proceed without business context for this
   assessment. This context is required for finding verification — without it,
   the verify workflow cannot evaluate whether behavior is 'by design' or
   assess CVSS environmental metrics. I have created a template at
   `<scope-name>/context.md`. Please fill in the application purpose, user base,
   and data classification. Once this file is filled in, I will proceed with
   plan scaffolding."*
4. Wait for the user to confirm or update context.md before continuing.

### If context.md exists but is empty (only comments/headers):

1. **STOP.** Same as missing — the file must have substantive content.
2. Point the user to the empty sections and ask them to fill them in.
3. Wait for confirmation before proceeding.

### If context.md exists and is filled in:

1. Proceed with plan scaffolding.
2. Reference context.md silently — do not show its contents unless requested.

### Context may be updated at any time:

- The operator can update context.md as the assessment progresses and new
  information emerges.
- The verify commands will read context.md fresh each time they run, so updates
  are automatically picked up.

## Plan Numbering

Plans use zero-padded numeric prefixes with descriptive slugs:

- `01-reconnaissance`
- `02-auth-testing`
- `03-session-management`

Auto-increment based on existing plans within that scope. If the user does not
specify a slug, suggest one based on context, but let them confirm or override.

## Scaffolding Workflow

### A. New Engagement (with first scope)

1. **Determine engagement name.**
   - Ask the user for an engagement name if not provided.
   - Create `<engagement-name>/` directory.
   - Create engagement root `AGENTS.md` from `references/engagement-agents-template.md`.

2. **Determine first scope name.**
   - Ask the user what the first scope should be called.
   - Create `<engagement-name>/<scope1>/` directory.

3. **Check ROE.**
   - Look for `<engagement-name>/<scope1>/ROE.md`.
   - Enforce the hard gate (see above).

4. **Check Business Context.**
   - Look for `<engagement-name>/<scope1>/context.md`.
   - Enforce the Business Context gate (see above).

5. **Create scope AGENTS.md.**
   - Create from `references/agents-template.md`.
   - Update engagement root AGENTS.md to list this scope.

6. **Create the plan directory.**
   - Use `01-<slug>/` under `<engagement-name>/<scope1>/plans/`.
   - Create all subdirectories and `plan.md`.
   - Update scope AGENTS.md plans table.

### B. Add Scope to Existing Engagement

1. **Detect engagement root.**
   - Look for `AGENTS.md` in the current directory or nearest ancestor.
   - If found, this is an existing engagement.

2. **Determine scope name.**
   - Ask the user for the new scope name.
   - Create `<engagement-name>/<scopeN>/` directory.

3. **Check ROE.**
   - Enforce the hard gate.

4. **Check Business Context.**
   - Enforce the Business Context gate.

5. **Create scope AGENTS.md.**
   - Update engagement root AGENTS.md scope list.

6. **Create plan directory** (if requested).

### C. Standalone Scope (backward compatible)

1. **Determine scope name.**
   - Ask the user for a scope name if not provided.
   - Create `<scope-name>/` directory.

2. **Check ROE.**
   - Enforce the hard gate.

3. **Check Business Context.**
   - Enforce the Business Context gate.

4. **Create scope AGENTS.md.**
   - Create from `references/agents-template.md`.

5. **Create plan directory** (if ROE and context gates satisfied).

## Scope = Assessment

Within a scope, there is no distinction between "scope" and "assessment". A
scope is a single assessment target with its own ROE, targets, and plans.

An engagement is a collection of related scopes that share a root directory for
coordination but maintain independent authorization boundaries.

## Evidence & Audit Trail Standards

Every test plan must maintain a complete, independently reviewable record. The
following are mandatory structural requirements, not optional suggestions.

### When Creating a Plan

- Create `audit.md` in the plan root from `references/audit-template.md`.
- The plan's Evidence Log must be maintained as steps are executed.

### When Executing a Step

- Log **every command executed** in `audit.md`, regardless of output.
- If the step produces output relevant to the assessment scope, additionally
  capture it in the `evidence/` directory using `references/evidence-template.md`
  before proceeding to the next step.
- Record exact commands, full output, timestamps, and environment state.
- Do not proceed to the next step without logging what happened in `audit.md`.

### When Discovering a Finding

- **STOP.** Do not continue testing past this finding until it is documented.
- Create a finding record in `findings/` from `references/finding-template.md`.
- The finding MUST reference at least one evidence file.
- The finding MUST include a "Retest Instructions" section with exact steps so
  someone else can independently reproduce it.

### Structural Rules

- Evidence files are raw data. Finding files are structured analysis. Never mix them.
- One evidence file per distinct observation or command output. Do not append
  unrelated outputs to the same file.
- Every finding must be traceable to at least one plan step and one evidence file.

## Cleanup & Closeout

Before a scope or engagement is considered complete, the following cleanup steps
are mandatory. The plan is NOT complete until this checklist is satisfied.

### Cleanup Checklist

- [ ] Remove all test accounts, credentials, or sessions created during testing
- [ ] Delete any uploaded files, backdoors, or payloads injected into the target
- [ ] Revert any configuration changes made to the target environment
- [ ] Reset any data records modified during testing to their pre-test state
- [ ] Remove any proxy rules, DNS entries, or network redirects configured for testing
- [ ] Verify no unauthorized access remains (revoke tokens, close sessions)
- [ ] Document anything intentionally left behind and why

### Cleanup Log

Record cleanup actions in the scope-level `AGENTS.md` under a **Cleanup Log**
section. Include: what was changed, how it was reverted, and who verified it.

### Final Closeout

A scope is not marked `Completed` until:
1. All active plans are satisfied
2. The Cleanup Checklist is complete
3. The Cleanup Log is documented
4. The scope-level `AGENTS.md` status is updated

## What This Skill Does NOT Do

- Run exploits, scanners, or active tests
- Generate CVSS scores
- Draft finding prose (use `pentest-report-writing`)
- Make network connections
- Bypass the ROE gate under any circumstances