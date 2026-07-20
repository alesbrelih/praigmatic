# Plan-file-only Refactor Implementation Plan

## Tasks

- [x] **Update pragmatic-implementation command** (NO_TTD) (Medium)
  - Remove TodoWrite parsing and creation logic
  - Implement direct plan file reading and checkbox tracking
  - Simplify pre-flight checks (remove todo validation)
  - Update acknowledgment to show plan file tasks only

- [x] **Refactor pragmatic-developer agent workflow** (NO_TTD) (Large)
  - Remove Phase 0 (Todo Acknowledgment) entirely
  - Simplify Phase 4 to only update plan file checkboxes
  - Eliminate all TodoWrite calls and todo array management
  - Update task completion flow: read plan → edit checkbox → commit → next task

- [x] **Create plan file utility functions** (NO_TTD) (Medium)
  - Implement atomic plan file update functions
  - Add checkbox parsing and updating utilities
  - Create task finding (next unchecked item) functions
  - Add plan file validation and error handling

- [x] **Update documentation** (NO_TTD) (Small)
  - Remove TodoWrite references from agent docs
  - Update planning guide for plan-file-only workflow
  - Simplify workflow examples
  - Remove todo system architecture documentation

## Architecture Overview

This refactor eliminates the dual-tracking system (plan files + TodoWrite) in favor of a streamlined plan-file-only approach:

**Current Architecture:**
```
Plan File (markdown) ↔ TodoWrite System ↔ Developer Agent
     ↓                    ↓               ↓
  Static Context     Runtime State    Complex Orchestration
```

**Target Architecture:**
```
Plan File (markdown) → Developer Agent
     ↓                    ↓
  All Context      Simple Direct Workflow
```

The plan file becomes the single source of truth for both task definitions and execution state.

## Technical Decisions

- **Decision 1**: Eliminate TodoWrite system entirely
  - Rationale: Removes 28+ failure modes, reduces context bloat, eliminates synchronization complexity
  - Trade-offs: Loss of runtime state tracking, but plan file checkboxes provide equivalent functionality

- **Decision 2**: Use Git as audit trail instead of TodoWrite history
  - Rationale: Git provides cryptographic verification, natural versioning, and familiar workflows
  - Trade-offs: Less granular than TodoWrite, but commit messages provide sufficient tracking

- **Decision 3**: Atomic file updates with temporary files
  - Rationale: Prevents file corruption during concurrent access without vulnerable file locking
  - Trade-offs: Slightly more complex than direct writes, but eliminates TOCTOU race conditions

- **Decision 4**: Simplified agent workflow phases
  - Rationale: Remove coordination complexity, reduce agent cognitive load
  - Trade-offs: Less flexibility than current multi-agent approach, but significantly simpler and more reliable

## Integration Points

**Files to Modify:**
- `.opencode/commands/pragmatic-implementation.md` - Remove todo creation logic
- `.opencode/agent/pragmatic-developer.md` - Remove Phase 0 and TodoWrite calls
- `.opencode/reference/planning-guide.md` - Update for plan-file-only workflow
- `.opencode/reference/ttd-criteria.md` - Remove todo-specific references

**Components to Remove:**
- TodoWrite tool integration
- Todo parsing and synchronization logic
- Dual state management systems
- Complex agent coordination patterns

**New Components:**
- Plan file utility library
- Atomic update functions
- Checkbox parsing and updating
- Simplified workflow orchestration

## Security Considerations

- **Runtime State Elimination**: Removes memory-based attack vectors (CWE-316)
  - Risk: Plan files use standard file permissions
  - Mitigation: OS-level file permissions and access controls

- **Atomic File Updates**: Prevents TOCTOU race conditions (CVE-2025-68146)
  - Risk: File corruption during concurrent access
  - Mitigation: Atomic rename pattern with temporary files

- **Git Audit Trail**: Provides cryptographic verification of changes
  - Risk: Compromised commit signing keys
  - Mitigation: Standard Git security practices, commit signing

- **Reduced Attack Surface**: Eliminates TodoWrite system and associated processes
  - Risk: Plan file access through file system
  - Mitigation: OS-level file permissions and access controls

## Testing Strategy

- **Unit Tests**: Plan file parsing and checkbox manipulation
- **Integration Tests**: End-to-end task execution workflow
- **Concurrency Tests**: Multiple agents accessing same plan file
- **Error Recovery Tests**: File corruption, interrupted operations, rollback scenarios

**Edge Cases to Verify:**
- Empty plan files
- Malformed markdown syntax
- Concurrent access conflicts
- Git merge conflicts in plan files
- File permission issues

## Risk Points

- **Risk 1**: File system conflicts during concurrent agent access
  - Mitigation: Atomic file updates, temporary file pattern
  - Fallback: Sequential access with retry logic

- **Risk 2**: Loss of granular progress tracking during complex tasks
  - Mitigation: Additional sub-checkboxes within task descriptions
  - Fallback: Manual status notes in task descriptions

- **Risk 3**: Git merge conflicts in plan files
  - Mitigation: Clear conflict resolution procedures
  - Fallback: Manual conflict resolution with plan file validation

## Dependencies

- Task 2 depends on Task 1 completing (implementation command needs utilities)
- Task 3 depends on Task 2 completing (developer agent uses utilities)
- Task 4 depends on Task 3 completing (docs need updated workflow)
- Task 5 depends on Task 4 completing (tests need finalized workflow)

**External Dependencies:**
- Standard file system operations
- Git commands for version control
- Atomic file write patterns (no external libraries)

## Implementation Notes

**Checkbox Pattern:**
```markdown
- [ ] **Task Name** (TTD_REQUIRED) (Medium)
  - Implementation detail 1
  - Implementation detail 2

- [x] **Completed Task** (NO_TTD) (Small)
  - Already implemented
```

**Agent Workflow (Simplified):**
1. Read plan file
2. Find first unchecked task (`- [ ]`)
3. Implement task (using plan context)
4. Edit checkbox to completed (`- [x]`)
5. Commit changes
6. Repeat from step 2

**Error Recovery:**
- Failed tasks remain unchecked
- Blocking notes added as sub-items
- No complex state synchronization required
- Git provides natural rollback capabilities

**Context Optimization:**
- Plan file size remains constant (~200-400 lines)
- No exponential context growth
- Single source of truth eliminates duplication
- Cleaner agent focus on implementation rather than state management