---
description: Migrate a repo from flat `.opencode/` to structured `.praigmatic/` — moves plans, extracts domain knowledge, scaffolds knowledge graph and decisions directory
---

# /migrate-praigmatic — Adopt the `.praigmatic/` Structure

This command helps a repo adopt the PrAIgmatic `.praigmatic/` knowledge-brain structure by analyzing existing plans and scaffolding the new layout. It is designed for repos that have accumulated plan files in `.opencode/plans/` and want to migrate to the separated engine (`./opencode/`) + project brain (`./praigmatic/`) model.

**YOU MUST EXECUTE THE FOLLOWING WORKFLOW IMMEDIATELY.**

> **Ordering note:** This command must be run **before** `/pragmatic-implementation` on any repo that has not yet adopted the `.praigmatic/` structure. The orchestrator command reads plans from `.praigmatic/plans/`, so attempting to use it pre-migration will produce an error.

---

## Pre-Flight Checks

### 1. Check Prerequisites

1. Verify the repo root has an `.opencode/` directory with a `plans/` subdirectory:
   - If `.opencode/plans/` does not exist, tell the user: "No plans found in `.opencode/plans/`. Nothing to migrate." and exit.
   - If `.opencode/plans/` exists but is empty (no `.md` files), tell the user: "`.opencode/plans/` exists but is empty. Nothing to migrate." and exit.

2. Check if `.praigmatic/` already exists:
   - If it does, warn: "`.praigmatic/` already exists. Running this command may overwrite existing files. Proceed? (y/N)"
   - If user declines, exit.

3. Validate that this repo uses the PrAIgmatic OpenCode config (i.e., `.opencode/commands/pragmatic-implementation.md` exists or similar markers). If uncertain, warn: "This does not appear to be a PrAIgmatic-configured repo. Continue anyway? (y/N)"

### 2. Load Glossary

Read `.opencode/reference/glossary.md` if it exists. The glossary provides the canonical definitions for domain terms (Agent, Orchestrator, Holistic Review, Knowledge Graph, ADR, etc.) that the migration command uses for analysis and file generation.

### 3. Report Initial State

Display to the user:

```
## Migration Pre-Flight

**Repo:** [basename of repo root]
**Existing plans:** [count] active, [count] archived
**`.praigmatic/` exists:** [Yes/No]
**Glossary found:** [Yes/No]

Proceed with migration?
```

Use the `question` tool. If declined, exit.

---

## Step 1: Catalog Existing Plans

### 1.1 Map Active Plans

Read `.opencode/plans/` and enumerate all `.md` files (excluding `README.md`). For each file, extract:
- **Filename** (without path and extension)
- **Title** (H1 heading, first `# ` line)
- **Purpose** (first sentence after title, or content of `## Purpose` section)
- **Task count** (count of `- [ ]` and `- [x]` checkbox items)
- **Architecture sections present** (check for: `## Architecture Overview`, `## Technical Decisions`, `## Security`, `## Testing`, `## Backwards Compatibility`, `## Integration Points`)
- **Key domain topics** (check for mentions of: agents, tools, commands, review, planner, developer, reviewer, QA, holistic, security, decisions, ADR, knowledge, workflow, planning, testing, glossary, TDD, packet, contract, archive, migration)
- **Cross-references** (mentions of `../knowledge/`, `../decisions/`, `../plans/`, `ADR-`)

Store results as an array of plan objects with these fields.

### 1.2 Map Archived Plans

Repeat 1.1 for `.opencode/plans/archive/` if it exists. Add `archived: true` to each entry. Include the archive date if present in the filename (the `YYYY-MM-DD` suffix between the last `-` and `.md`).

### 1.3 Aggregate Topic Frequencies

Collect every domain topic mention across all plans. Deduplicate and normalize (lowercase, strip whitespace). Produce a frequency table:

```
| Topic            | Active Plans | Archived Plans | Total Mentions |
|------------------|-------------|----------------|----------------|
| agents           | 5           | 12             | 17             |
| tools            | 3           | 8              | 11             |
| review           | 4           | 15             | 19             |
| ...              |             |                |                |
```

Substantial topics (those appearing in 3+ plans or with 5+ total mentions) become **candidate domain areas**.

### 1.4 Identify Architecture Section Patterns

Across all plans, collect:
- Which architecture sections appear most frequently (e.g., `## Technical Decisions` appears in 8/10 plans)
- Recurring decision patterns (e.g., "parameter over global config", "file over monolithic")
- Common testing strategy patterns

---

## Step 2: Analyze Plans for Domain Knowledge

### 2.1 For Each Candidate Topic, Extract Seed Content

For each substantial topic (frequency >= 3 plans or >= 5 mentions):

1. Collect all plan `## Purpose` and `## Architecture Overview` sections that mention the topic.
2. Collect all `## Technical Decisions` entries that relate to the topic.
3. Collect relevant cross-references (ADR references, knowledge path references).

### 2.2 Compute Confidence Score

Score each candidate domain area using mention frequency thresholds. Count the total mentions
of the topic across all plans and the number of unique plans that mention it:

| Condition | Band | Label |
|-----------|------|-------|
| ≥10 mentions **and** ≥5 plans | **Well-Established** | Rich body of knowledge across multiple plans |
| 5-9 mentions **and** 3-4 plans | **Developing** | Decent coverage but gaps remain |
| 2-4 mentions **and** 1-2 plans | **Emerging** | Limited evidence, needs refinement |
| 1 mention **and** 1 plan | **Speculative** | Minimal evidence, may not warrant a dedicated file |

Topics with 0 mentions are excluded entirely.

### 2.3 Select Domain Areas for Knowledge Files

Select the top 3-10 domain areas for draft knowledge files. Prioritize:
1. Well-Established domains first
2. Developing domains that bridge conceptual gaps (e.g., "workflow" and "agents" may overlap)
3. Emerging domains that represent distinct architectural concerns

Map each selected domain area to a potential knowledge file name (kebab-case, e.g., `workflow.md`, `agents.md`, `review-loops.md`).

---

## Step 3: Scaffold `.praigmatic/` Directory

### 3.1 Create Directory Structure

```bash
mkdir -p .praigmatic/plans/archive
mkdir -p .praigmatic/knowledge
mkdir -p .praigmatic/decisions
```

If any directory already exists, skip it but note the existing contents.

### 3.2 Generate `.praigmatic/knowledge/index.md`

Create a knowledge index file listing all discovered domain areas. Follow this template:

```markdown
# Knowledge Graph

This directory documents the [repo name] project's domain knowledge, extracted from
implementation plan history. These files serve as the canonical reference for how
the system works.

## Domain Areas

### [Domain Name](./domain-file.md)
**Confidence:** [Well-Established | Developing | Emerging | Speculative]

[2-3 sentence summary synthesized from plan purposes and architecture sections that
mention this domain. Describe what this domain covers and why it matters.]

**Sources:** [count] plans
**Key topics:** [list of key terms from frequency analysis]
**Related:** [list of related domain areas]

### [Next Domain...]

## How to Use

- **New contributors:** Start with the highest-confidence domains for the big picture.
- **Planning new work:** Load relevant domain files before planning to build on existing knowledge.
- **Extending the system:** Review related domains for integration points.

## Next Steps After Review

1. Review each draft knowledge file for accuracy and completeness
2. Remove or merge low-confidence domains as appropriate
3. Add cross-references between related domains
4. Commit the new `.praigmatic/` structure
```

### 3.3 Generate Draft Knowledge Files

For each selected domain area, create a draft knowledge file at `.praigmatic/knowledge/{name}.md` using this template:

```markdown
# {Domain Name}: Extracted from Plan History

**Auto-generated by `/migrate-praigmatic` — review and refine**

## Overview

[1-2 paragraphs synthesized from plan Purpose and Architecture Overview sections
that mention this domain. Focus on what this domain covers, its role in the system,
and why it matters.]

## Key Concepts

{For each distinct concept identified across plans:}
### Concept Name

[Synthesized from plan sections mentioning this concept. Include rationale when
available.]

## Architecture / Key Points

[Bullet list of architectural characteristics extracted from plan ## Architecture
Overview and ## Technical Decisions sections. Group related points.]

## Related Plans

| Plan | Date | Relevant For |
|------|------|-------------|
| [{Plan Title}](../../plans/{filename}) | {date or archive link} | {what this plan contributes to this domain} |

## Related ADRs

[Only if cross-references to ADRs were found; otherwise omit this section.]

## Related Domains

[Only if other candidate domains intersect; otherwise omit this section.]

---

_Draft generated by `/migrate-praigmatic`. Verify accuracy, fill gaps, and remove
this notice after review._
```

### 3.4 Generate `.praigmatic/decisions/README.md`

If the `.praigmatic/decisions/` directory is newly created (did not exist before), create a README with the ADR template:

```markdown
# Architectural Decisions

This directory records architectural decisions made during the [repo name] project.
Each record captures why a particular approach was chosen, what alternatives were
considered, and what the trade-offs are.

## Conventions

- **Sequential numbering:** Files use four-digit numbers starting at `0001`.
- **Status in the document:** Every ADR embeds its own status (Proposed / Accepted /
  Deprecated / Superseded) so you can tell at a glance whether it's still active.
- **Cross-references:** ADRs link to related knowledge files (`../knowledge/...`),
  plan files (`../plans/...`), or other ADRs (ADR-XXXX).

## Template

```markdown
# NNNN: Title

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD

## Context

What is the issue that is motivating this decision or change?

## Decision

What change are we proposing or making?

## Consequences

What becomes easier or more difficult because of this change?
Include trade-offs.

## Related

- Knowledge: `../knowledge/...`
- Plans: `../plans/...`
- See also: ADR-XXXX
```

## Active Decisions

{List any decisions extracted from plan Technical Decisions sections, with proposal
to move them into numbered ADR files. If no clear decisions:}

_No ADRs have been created yet. As architectural decisions accumulate, add entries
here with sequential numbering (0001, 0002, ...)._
```

---

## Step 4: Move Plans and Update Path References

### 4.1 Move Active Plans

Copy all `.md` files from `.opencode/plans/` to `.praigmatic/plans/` (excluding `README.md`). Use `git mv` if in a git repo, otherwise `mv`. Preserve all file contents.

```bash
# For each .md file in .opencode/plans/ (excluding README.md):
git mv .opencode/plans/{file}.md .praigmatic/plans/{file}.md
```

If any file already exists at the destination, skip with a warning.

### 4.2 Move Archived Plans

Repeat for `.opencode/plans/archive/` → `.praigmatic/plans/archive/`.

### 4.3 Move README

If `.opencode/plans/README.md` exists:
```bash
git mv .opencode/plans/README.md .praigmatic/plans/README.md
```

### 4.4 Remove Empty Directories

After moving all files, remove the empty `.opencode/plans/` directory tree:

```bash
rmdir .opencode/plans/archive 2>/dev/null; rmdir .opencode/plans/ 2>/dev/null
```

---

## Step 5: Generate `.praigmatic/index.md` Hub Entry Point

Create `.praigmatic/index.md` as the top-level entry point:

```markdown
# [Repo Name] Knowledge Base

The `.praigmatic/` directory is the project's structured brain — separating project
intelligence from OpenCode engine configuration. While `.opencode/` holds the engine
(agents, tools, commands, skills), `.praigmatic/` holds project-specific knowledge:
plans, decisions, and domain understanding accumulated during development.

> _Initialized by `/migrate-praigmatic` on [current date]. Review and refine the
> generated knowledge files._

## Directory Map

| Directory | Purpose |
|-----------|---------|
| [`knowledge/`](knowledge/index.md) | Domain knowledge about the project |
| [`decisions/`](decisions/README.md) | Architectural and technical decision records (ADRs) |
| [`plans/`](plans/README.md) | Implementation plans (active and archived) |

## Quick Start

**I want to understand the project's domain knowledge:**
1. Browse [`knowledge/index.md`](knowledge/index.md) for discovered domain areas
2. Read the highest-confidence domain files for the big picture

**I want to create a new plan:**
1. Load relevant knowledge files from [`knowledge/`](knowledge/index.md) as context
2. Add your plan to [`plans/`](plans/) using the executable contract format

**I want to understand a past decision:**
1. Browse [`decisions/README.md`](decisions/README.md) for ADRs
2. Cross-reference with [`knowledge/`](knowledge/index.md) for related documentation

## Knowledge Graph

{List each generated knowledge file with a 1-line summary, e.g.:}

- **[Workflow](knowledge/workflow.md)** — [extracted summary]
- **[Agents](knowledge/agents.md)** — [extracted summary]

## Contributing

When adding to the knowledge base:
- Use terminology consistently
- Add new ADRs when making architectural decisions
- Update relevant knowledge files when understanding evolves
- Reference ADRs and plans from knowledge files to maintain traceability
```

---

## Step 6: Present Migration Summary

After all steps complete, display a structured summary:

```markdown
## Migration Complete

### Summary
- **Plans moved:** X (Y active, Z archived)
- **Domain areas discovered:** Y
- **Knowledge files drafted:** Z
- **ADRs initialized:** [Yes/No]

### Generated Files

{Table of all files created or moved}

| File | Status | Notes |
|------|--------|-------|
| `.praigmatic/knowledge/index.md` | Created | Lists [Y] domain areas |
| `.praigmatic/knowledge/{domain}.md` | Drafted | Confidence: [band] |
| ... | | |
| `.praigmatic/decisions/README.md` | Created | ADR template + conventions |
| `.praigmatic/plans/{plan}.md` | Moved | From `.opencode/plans/` |
| `.praigmatic/index.md` | Created | Hub entry point |

### Domain Area Summary

{For each domain area, show:}
- **{Name}** ({band}) — {short summary}

### Next Steps

1. **Review knowledge files** — Each draft file has a `_Draft generated by /migrate-praigmatic_` notice. Read each one, verify accuracy, fill gaps, remove the notice.
2. **Consolidate low-confidence domains** — Merge or remove domains below the threshold.
3. **Create initial ADRs** — For plans with strong Technical Decisions sections, consider creating numbered ADR files.
4. **Commit** — Stage all new `.praigmatic/` files, remove empty `.opencode/plans/`, commit with message like `chore(praigmatic): migrate project knowledge to .praigmatic/ structure`
```

Use the `question` tool to present the summary and ask:
"Review the summary above. Stage all changes for commit? (y/N)"

If confirmed, stage all new and moved files:
```bash
git add .praigmatic/
git add -A .opencode/plans/ 2>/dev/null; git rm -r .opencode/plans/ 2>/dev/null
```

---

## Templates

### Knowledge File Draft Template

```markdown
# {Domain Name}: Extracted from Plan History

**Auto-generated by `/migrate-praigmatic` — review and refine**

## Overview

{2-3 sentences from aggregated plan content}

## Key Concepts

{List of concepts with definitions synthesized from plan sections}

## Architecture / Key Points

{Architectural characteristics from plan sections}

## Related Plans

| Plan | Date | Relevant For |
|------|------|-------------|
| [Plan title](../../plans/{filename}.md) | {date} | {summary} |

## Related ADRs

{Only if ADR cross-references found}

---

_Draft generated by `/migrate-praigmatic`. Verify accuracy, fill gaps, and remove
this notice after review._
```

### Knowledge Index Template

```markdown
# Knowledge Graph

{Standard opening, listing each domain area with confidence score and summary}
```

---

## Error Handling

- **Plan not found:** If `.opencode/plans/` does not exist, exit with message and no changes.
- **Read permission error on any plan:** Skip the plan, include in summary as "Skipped (permission error)".
- **Knowledge file already exists:** Skip with warning — do not overwrite.
- **`git mv` fails:** Fall back to `mv` + `git add` + `git rm`.
- **Both git approaches fail:** Fall back to `cp` + `rm` (pure filesystem), report "Git operations unavailable; used filesystem copy."
- **Any step fails:** Report the error, show partial progress, and ask user whether to roll back or commit partial changes.

## Completion

Return the migration summary as the completion message. No machine-parseable result block is needed — this command speaks directly to the user.
