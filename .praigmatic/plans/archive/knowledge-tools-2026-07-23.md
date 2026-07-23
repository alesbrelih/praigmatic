# Knowledge File Tools Implementation Plan

## Purpose
Add two new tools (`list-knowledge-files` and `read-knowledge-file`) to give the pragmatic-planner-v2 programmatic access to the knowledge graph during pre-flight knowledge loading.

## Metadata
**References:** N/A

## Planning Summary
| Stage | Step | Status | Notes |
|-------|------|--------|-------|
| 1 | Explore | Run | Analyzed existing tool infrastructure, knowledge file formats, test patterns |
| 1 | Clarify | Skip | Request is clear: two tools for listing/reading knowledge files |
| 1 | Analyze | Complete | Skills: customize-opencode. Unknowns: None. Complexity: Simple |
| 1 | Direction | Approved | Two thin tools, verb-first naming, heading-parsed listing, scoped file reader |
| 2 | Research | Skip | No unknowns; patterns fully understood from exploration |
| 2 | Plan | Complete | 4 tasks |
| 2 | Review | Approved | 4 tasks, no split needed. Single low-severity formatting note resolved. |

## Tasks

- [x] **Create list-knowledge-files tool** (Small)
  - Purpose: List all knowledge files in `.praigmatic/knowledge/` with their document titles
  - Acceptance: Running the tool returns sorted list of `filename: Title` lines, one per markdown file; handles missing directory gracefully with error string
  - Steps:
    - Create `.opencode/tools/list-knowledge-files.ts` following the `@opencode-ai/plugin` tool pattern
    - Implement `execute()`: resolve knowledge dir from `context.directory`, read directory, filter `.md` files, parse `# ` heading from each file, format as `filename: Title
    - Handle errors: missing or empty knowledge directory returns descriptive error string; files without `# ` heading still listed with filename only
  - Files: [`.opencode/tools/list-knowledge-files.ts`]
  - Dependencies: None
  - Context Tags: interface
  - Produces: list-knowledge-files` tool available to planner agents
  - Actual Files: .opencode/tools/list-knowledge-files.ts
  - Notes: Created list-knowledge-files.ts — a deterministic tool that reads .praigmatic/knowledge/, filters .md files, sorts them, parses each file's # heading, and returns formatted filename: Title lines. Handles missing directory, empty directory, and files without titles gracefully.
- [x] **Create read-knowledge-file tool** (Small)
  - Purpose: Read and return the full content of a named knowledge file
  - Acceptance: Given a valid filename (e.g., `agents.md`), returns the file's complete markdown content; rejects non-.md files, `../` escapes, and missing files with clear error messages
  - Steps:
    - Create `.opencode/tools/read-knowledge-file.ts` following the `@opencode-ai/plugin` tool pattern with a required `file` string arg
    - Implement `execute()`: accept `file` arg, resolve to knowledge dir, validate file ends with `.md` and contains no path traversal, read and return content
    - Handle errors: missing file returns "not found" with available files list; `../` or non-.md returns descriptive rejection
  - Files: [`.opencode/tools/read-knowledge-file.ts`]
  - Dependencies: None
  - Context Tags: interface
  - Produces: read-knowledge-file` tool available to planner agents
  - Actual Files: .opencode/tools/read-knowledge-file.ts
  - Notes: Created read-knowledge-file tool with required file arg, .md-only validation, ../ traversal rejection, missing-file error with available files listing, and knowledge dir resolution from context.directory with process.cwd() fallback.
- [x] **Add tests for both tools** (Medium)
  - Purpose: Ensure both tools work correctly across happy paths and edge cases
  - Acceptance: All tests pass with `npx vitest run`; coverage includes listing, reading, missing dirs/files, heading parsing edge cases, escape prevention
  - Steps:
    - Create `.opencode/tools/__tests__/list-knowledge-files.test.ts` with Vitest + `fs/promises` mock
    - Test list-knowledge-files: happy path (multiple .md files with # headings), files without headings (fallback to filename), empty directory, directory doesn't exist
    - Create `.opencode/tools/__tests__/read-knowledge-file.test.ts` with Vitest + `fs/promises` mock
    - Test read-knowledge-file: valid file read returns content, file not found returns error, `../` escape rejected, non-.md file rejected
    - Run `npx vitest run` in `.opencode/` to verify all tests pass
  - Files: [`.opencode/tools/__tests__/list-knowledge-files.test.ts, .opencode/tools/__tests__/read-knowledge-file.test.ts`]
  - Dependencies: [Create list-knowledge-files tool, Create read-knowledge-file tool]
  - Actual Files: .opencode/tools/__tests__/list-knowledge-files.test.ts, .opencode/tools/__tests__/read-knowledge-file.test.ts
  - Notes: 23 tests across 2 new test files, all passing. Coverage includes listing, reading, missing dirs/files, heading parsing edge cases, and escape prevention. Note: node_modules @opencode-ai/plugin ESM fix (extensionless import) not staged — gitignored.
- [x] **Update knowledge documentation** (Small)
  - Purpose: Document the new tools in the knowledge graph so they are discoverable
  - Acceptance: `.praigmatic/knowledge/tools.md` includes a new Knowledge Tools section describing both tools with their purpose, inputs, and outputs
  - Steps:
    - Add a `#### Knowledge Tools` sub-section under the `### Utility Tools` section in `.praigmatic/knowledge/tools.md
    - Document `list-knowledge-files`: description, input (none), output format (filename: Title per line), error handling
    - Document `read-knowledge-file`: description, input (file arg), output (file content), validation rules, error handling
  - Files: [`.praigmatic/knowledge/tools.md`]
  - Dependencies: [Create list-knowledge-files tool, Create read-knowledge-file tool]
  - Actual Files: .praigmatic/knowledge/tools.md
  - Notes: Added Knowledge Tools sub-section under Utility Tools documenting list-knowledge-files and read-knowledge-file with inputs, outputs, validation, and error handling.
## Architecture Overview
Two new auto-discovered tools drop into the existing `.opencode/tools/` directory alongside 28 existing tools. They follow the identical `@opencode-ai/plugin` pattern with no new dependencies, no shared library changes, and no config changes. Both resolve the knowledge directory from `context.directory` with a `process.cwd()` fallback, keeping them consistent with `find-plan.ts` and other path-aware tools.

The tools give the pragmatic-planner-v2 agent programmatic access during its pre-flight knowledge loading step — replacing the current ad-hoc `Read` + `Glob` approach with deterministic, structured calls that handle errors gracefully and return exactly what the planner needs.

## Technical Decisions
- **Decision**: Verb-first naming (`list-knowledge-files`, `read-knowledge-file`) — Rationale: Matches existing tool naming convention (`find-plan`, `get-current-date`, `archive-plan`). Every tool does one thing. — Trade-offs: Two tools instead of one combined tool; acceptable for consistency with codebase.
- **Decision**: Parse `# ` headings for rich listing output — Rationale: Saves one round-trip vs. listing bare filenames then reading each file for the title. — Trade-offs: ~5 extra LOC for heading parsing; negligible at this scale.
- **Decision**: Scoped file reader (knowledge dir only, no `../` escapes) — Rationale: Keeps tool contract narrow and predictable; general file reading stays with the built-in `Read` tool. — Trade-offs: Cannot read files outside knowledge dir; this is the intended design.
- **Decision**: No shared library reuse — Rationale: Knowledge tools operate on `.praigmatic/knowledge/`, not `.praigmatic/plans/`. Coupling plan helpers into knowledge tools would muddy both modules. — Trade-offs: ~2 lines of duplicated path resolution; acceptable for 2 tools.

## Security Considerations
- Path traversal prevention: `read-knowledge-file` validates no `../` sequences or absolute paths in the `file` arg, keeping reads scoped to `.praigmatic/knowledge/`.
- No content injection: Both tools read files only; they do not write, modify, or execute anything.
- Input validation: File arg must end in `.md` to prevent reading arbitrary binaries or config files.

## Testing Strategy
- Unit: Vitest tests for both tools using `vi.mock("node:fs/promises")` to mock filesystem operations. Tests cover happy paths, missing files, empty directories, heading parsing edge cases, and escape prevention.
- Integration: Manual verification by invoking tools after restarting OpenCode; tools are auto-discovered with no registration step.












