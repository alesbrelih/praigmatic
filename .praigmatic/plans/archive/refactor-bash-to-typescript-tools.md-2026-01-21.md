# Refactor Bash Code to TypeScript Custom Tools

## Purpose

Replace embedded bash code blocks in `pragmatic-implementation.md` with properly structured TypeScript custom tools using OpenCode's simple `tool()` helper pattern. This improves maintainability, adds type safety, and follows OpenCode best practices.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** RUN
**Rationale:** Needed to understand existing patterns and whether custom tool infrastructure exists
**Finding:** Codebase has NO custom tools - currently uses bash-in-markdown pattern

### Phase 2: Clarification
**Decision:** RUN
**Rationale:** Multiple valid approaches exist (TypeScript tools vs bash vs hybrid)
**Questions Asked:**
- Q: Which refactoring approach?
- A: TypeScript custom tools (follow OpenCode best practices)
- Q: Why MCP SDK? Should use simpler pattern?
- A: Confirmed - use `@opencode-ai/plugin` `tool()` helper (correct approach)

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None (OpenCode tool pattern is well-documented)
**Complexity assessment:** Small - Simple tool() helper pattern, no complex infrastructure needed, 3 tools

### Phase 4: Research
**Decision:** SKIP
**Rationale:** OpenCode custom tools documentation is clear and straightforward - no additional research needed

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research conducted, straightforward implementation pattern

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 4
**Task size distribution:** Small: 4

## Tasks

- [x] **Create find-plan tool** (Small)
  - Purpose: Replace bash plan file discovery logic with a type-safe custom tool
  - Steps:
    - Create `.opencode/tools/find-plan.ts` file
    - Import `tool` from `@opencode-ai/plugin`
    - Define args with optional `planName` string (using `tool.schema.string()`)
    - Implement execute function: if planName provided, construct path; otherwise use `ls -t` to find most recent .md in .opencode/plans/
    - Return file path as string or error message if not found
    - Export default tool object
    - Test tool discovery by checking if OpenCode recognizes it
  - Files: `.opencode/tools/find-plan.ts`
  - Dependencies: None

- [x] **Create validate-git-state tool** (Small)
  - Purpose: Replace bash git validation logic with a custom tool that checks for uncommitted changes
  - Steps:
    - Create `.opencode/tools/validate-git-state.ts` file
    - Import `tool` from `@opencode-ai/plugin`
    - Define args with optional `allowUncommitted` boolean
    - Implement execute function: run `git diff-index --quiet HEAD --` using Bun.$ or similar
    - If changes detected, run `git status --short` and return formatted output
    - Return object: `{ valid: boolean, message: string, files: string[] }`
    - Export default tool object
  - Files: `.opencode/tools/validate-git-state.ts`
  - Dependencies: None

- [x] **Create archive-plan tool** (Small)
  - Purpose: Replace bash plan archiving logic with a custom tool that moves plan files to archive directory with timestamp
  - Steps:
    - Create `.opencode/tools/archive-plan.ts` file
    - Import `tool` from `@opencode-ai/plugin`
    - Define args with required `planPath` string
    - Implement execute function:
      - Generate timestamp: `date +%Y-%m-%d` using Bun.$
      - Create archive directory if not exists: `.opencode/plans/archive/`
      - Generate new filename: `${basename}-${timestamp}.md`
      - Move file using Bun.$ `mv` command
    - Return new archive path or error if move fails
    - Export default tool object
  - Files: `.opencode/tools/archive-plan.ts`
  - Dependencies: None

- [x] **Update pragmatic-implementation command** (Small)
  - Purpose: Replace bash code blocks with tool invocations while maintaining identical functionality
  - Steps:
    - Replace Step 1 bash block (lines 9-21) with reference to use find-plan tool
    - Replace Step 2 bash block (lines 25-34) with reference to use validate-git-state tool
    - Replace Step 5.6.2 bash block (lines 268-280) with reference to use archive-plan tool
    - Update command text to describe tool usage instead of bash commands
    - Preserve all existing functionality and error handling logic
    - Test that command still works with tools
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: Tasks 1, 2, 3

## Architecture Overview

This refactoring introduces OpenCode custom tools using the simple `tool()` helper pattern:

**Before:**
```
.opencode/commands/
  └── pragmatic-implementation.md
      ├── bash code blocks (lines 9-21, 25-34, 268-280)
      ├── Imperative shell operations
      └── Hard to test and maintain
```

**After:**
```
.opencode/
  ├── commands/
  │   └── pragmatic-implementation.md
  │       ├── Tool invocation descriptions
  │       └── No bash code blocks
  └── tools/
      ├── find-plan.ts
      ├── validate-git-state.ts
      └── archive-plan.ts
```

**Integration:**
- Tools auto-discovered from `.opencode/tools/` by OpenCode
- LLM automatically has access to tools during conversations
- No registration or configuration needed
- Tools appear alongside built-in tools (read, write, bash, etc.)

## Technical Decisions

- **Decision 1**: Use `@opencode-ai/plugin` `tool()` helper (not MCP SDK)
  - Rationale: Simple pattern, auto-discovery, follows OpenCode best practices
  - Trade-offs: None - this is the correct approach for OpenCode

- **Decision 2**: Tools in `.opencode/tools/` (not `src/`)
  - Rationale: OpenCode discovers tools from this location automatically
  - Trade-offs: None - required for tool discovery

- **Decision 3**: Use Bun.$ for shell execution in tools
  - Rationale: Simple shell command execution, async/await support
  - Trade-offs: Requires Bun runtime (OpenCode already uses it)

- **Decision 4**: Return structured results from tools
  - Rationale: Better than plain text for parsing in commands
  - Trade-offs: Slightly more complex parsing, but more robust

## Integration Points

### Tool Files Location
All tool files must be in `.opencode/tools/` directory:
```
.opencode/tools/
├── find-plan.ts
├── validate-git-state.ts
└── archive-plan.ts
```

### Tool Naming Convention
- **Filename**: kebab-case (e.g., `find-plan.ts`)
- **Tool name**: Filename becomes tool name (e.g., `find-plan`)
- **Multiple tools per file**: Use named exports → `<filename>_<exportname>` (not needed here)

### Command Invocation
Update command to reference tools instead of embedding bash:
```markdown
## Step 1: Find Plan File

Use the **find-plan** tool to locate the most recent plan file.
If a plan file name is provided as an argument, use that path.
Otherwise, the tool will automatically find the most recent plan file
in `.opencode/plans/`.

Example tool invocation: The LLM can call `find-plan` with optional `planName` argument.
```

### Files Affected
- **New**: `.opencode/tools/find-plan.ts`, `.opencode/tools/validate-git-state.ts`, `.opencode/tools/archive-plan.ts`
- **Modified**: `.opencode/commands/pragmatic-implementation.md` (bash blocks replaced with tool descriptions)
- **Unchanged**: Plan files, git workflow, agent interactions

## Security Considerations

- **Tool argument validation**: All inputs validated by Zod schemas via `tool.schema`, preventing injection attacks
- **File system access**: Tools limited to specific directories (`.opencode/plans/`, `.opencode/plans/archive/`)
- **Git operations**: Only read operations (`git diff-index`, `git status`), no destructive commands
- **Path validation**: Zod string schemas prevent path traversal by default
- **Error messages**: No sensitive information leaked in tool responses

## Testing Strategy

### Tool Discovery Tests
- Verify tools are discovered by OpenCode: Check that `find-plan`, `validate-git-state`, `archive-plan` appear in available tools
- Test tool signatures: Verify argument types and descriptions are correct

### Functional Tests
- Test `find-plan`: With plan name, without plan name, no plans found, multiple plans (should pick most recent)
- Test `validate-git-state`: Clean git state, dirty state (modified files), staged changes, untracked files
- Test `archive-plan`: Valid plan path, non-existent file, archive dir creation, duplicate filenames

### Integration Tests
- Run `pragmatic-implementation` command with test plan file
- Verify tools are automatically invoked by LLM when needed
- Check error handling: Tool failures properly reported, command doesn't crash

### Edge Cases
- `.opencode/plans/` directory doesn't exist
- Plan file with invalid name characters
- Git repository not initialized
- Archive directory permission denied
- Concurrent access to same plan file

## Risk Points

- **Risk 1**: Tools not discovered by OpenCode
  - Mitigation: Verify file location (`.opencode/tools/`), check TypeScript syntax, use correct export pattern
  - Fallback: Check OpenCode logs for tool loading errors

- **Risk 2**: Bun.$ not available in tool context
  - Mitigation: Use alternative Node.js child_process if Bun.$ unavailable
  - Fallback: Implement using Node.js built-in `child_process.exec`

- **Risk 3**: Tool execution fails silently
  - Mitigation: Always return error messages from tools, add try-catch blocks, log errors
  - Fallback: Add debug logging to tools for troubleshooting

- **Risk 4**: Breaking existing command functionality
  - Mitigation: Keep bash code as comments during migration, test command thoroughly
  - Fallback: Restore original command from git if tools cause issues

## Dependencies

- **Task Order**:
  - Tasks 1, 2, 3 (tools) can run in parallel (no dependencies between them)
  - Task 4 (command update) must wait for Tasks 1, 2, 3 to complete

- **External Dependencies**:
  - `@opencode-ai/plugin` (provided by OpenCode, no npm install needed)
  - Zod (included in `@opencode-ai/plugin`)
  - Bun runtime (OpenCode already uses it)

- **Runtime Dependencies**:
  - Bun for shell command execution (Bun.$)
  - Git for `validate-git-state` tool
  - File system permissions for reading/moving files

## Implementation Notes

### Tool Pattern
Follow this simple pattern for all tools:

```typescript
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Clear one-line description of what tool does",
  args: {
    paramName: tool.schema.string().describe("What this parameter is"),
    optionalParam: tool.schema.boolean().optional(),
  },
  async execute(args) {
    try {
      // Tool implementation here
      // Use Bun.$ for shell commands
      const result = await Bun.$`some command ${args.paramName}`.text();

      // Return result
      return result.trim();
    } catch (error) {
      return `Error: ${error.message}`;
    }
  },
});
```

### Example: find-plan tool
```typescript
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Find the most recent plan file in .opencode/plans/ or use provided name",
  args: {
    planName: tool.schema.string().optional().describe("Optional plan file name (without .opencode/plans/ prefix)"),
  },
  async execute({ planName }) {
    try {
      if (planName) {
        const path = `.opencode/plans/${planName}`;
        const exists = await Bun.file(path).exists();
        if (!exists) {
          return `Error: Plan file not found: ${path}`;
        }
        return path;
      }

      // Find most recent .md file
      const result = await Bun.$`ls -t .opencode/plans/*.md 2>/dev/null | grep -v README | head -1`.text();
      const path = result.trim();

      if (!path) {
        return "Error: No plan files found in .opencode/plans/";
      }

      return path;
    } catch (error) {
      return `Error finding plan: ${error.message}`;
    }
  },
});
```

### Example: validate-git-state tool
```typescript
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Validate git state - check for uncommitted changes",
  args: {
    allowUncommitted: tool.schema.boolean().optional().describe("Whether to allow uncommitted changes"),
  },
  async execute() {
    try {
      // Check for uncommitted changes
      const code = await Bun.$`git diff-index --quiet HEAD --`.exitCode;

      if (code === 0) {
        return JSON.stringify({
          valid: true,
          message: "Git state is clean",
          files: [],
        });
      }

      // Get changed files
      const status = await Bun.$`git status --short`.text();

      return JSON.stringify({
        valid: false,
        message: "Uncommitted changes detected",
        files: status.trim().split('\n').filter(f => f),
      });
    } catch (error) {
      return JSON.stringify({
        valid: false,
        message: `Error checking git state: ${error.message}`,
        files: [],
      });
    }
  },
});
```

### Error Handling Pattern
Always wrap tool logic in try-catch:
```typescript
async execute(args) {
  try {
    // Implementation
    return result;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}
```

### Tool Discovery
No registration needed - OpenCode automatically discovers tools from `.opencode/tools/`. To verify tools are loaded:
1. Start OpenCode
2. Ask: "What tools do you have available?"
3. Verify `find-plan`, `validate-git-state`, `archive-plan` are listed

### Command Integration
Commands don't explicitly invoke tools - the LLM automatically calls them as needed. Update command documentation to describe:
- What the tool does
- When it's used
- What arguments it takes
- What it returns

Example:
```markdown
## Step 1: Find Plan File

The **find-plan** tool locates the most recent plan file in `.opencode/plans/`.

**Usage:**
- Call the tool with no arguments to get the most recent plan
- Or provide `planName` argument to get a specific plan

**Returns:**
- File path to plan (e.g., `.opencode/plans/example-plan.md`)
- Error message if no plans found
```
