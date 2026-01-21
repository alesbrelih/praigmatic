# New Interface: Command → Developer

## Date
2026-01-21

## Purpose
Define clear contract for command invoking developer, enabling developer to be plan-agnostic and reusable for both planned and ad-hoc tasks.

## 1. Invocation Format

### Basic Structure
The command invokes the developer agent with a structured prompt containing all necessary context.

### Prompt Template

```markdown
# Task Execution Request

## Task Information
**Task Name:** [string]
**Purpose:** [string - what this task should achieve]

## Context
### Architecture
- [Optional] Architecture overview or patterns relevant to this task
- [Optional] Existing similar implementations to reference

### Decisions
- [Optional] Prior decisions that constrain this task
- [Optional] Technology choices already made

### Security Considerations
- [Optional] Security requirements or constraints
- [Optional] Known security issues to avoid

## Task Steps
1. [Step 1]
2. [Step 2]
3. [...]

## Files to Modify
- `path/to/file1` - [description of changes]
- `path/to/file2` - [description of changes]
- [...]

## Additional Context
[Optional: Any other information needed for this task]
```

## 2. Required Fields

### Must Include
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `Task Name` | string | Human-readable name of the task | "Implement user authentication" |
| `Purpose` | string | What the task should achieve (why, not just what) | "Add JWT-based authentication to protect API endpoints" |
| `Task Steps` | list | Sequential steps to complete the task | "1. Create auth service, 2. Add middleware, 3. Test" |
| `Files to Modify` | list | Files that will be modified and why | `src/auth.ts` - Add authentication functions |

### Optional but Recommended
| Field | Type | When to Include | Example |
|-------|------|----------------|---------|
| `Architecture` | string | When task involves architectural decisions | "Follow existing service pattern in src/services/" |
| `Decisions` | string | When task is constrained by prior decisions | "Use bcrypt for password hashing (per security review)" |
| `Security Considerations` | string | When task involves security-sensitive operations | "Never log tokens, always validate input" |

## 3. Expected Output Format

The developer agent MUST provide a structured completion message in one of three formats:

### 3.1 Success Format
```markdown
✅ **Task Completed:** [Task Name]

**Files Modified:**
- `file1.ts` - [changes made]
- `file2.ts` - [changes made]

**Summary:** [Brief description of what was done]
```

### 3.2 Failure Format
```markdown
❌ **Task Failed:** [Task Name]

**Error:** [Clear description of what went wrong]

**Attempted Changes:**
- `file1.ts` - [changes that were made before failure]

**Next Steps:** [What needs to be done to recover]
```

### 3.3 Blocked Format
```markdown
⚠️ **Task Blocked:** [Task Name]

**Blocker:** [Clear description of what's blocking]

**Attempts Made:** [What was tried and why it didn't work]

**Required Action:** [What user needs to provide or fix]
```

## 4. Context Passing

### Architecture Context
**When needed:**
- Task introduces new patterns or structures
- Task involves complex architectural decisions
- Multiple approaches are possible

**How to pass:**
```markdown
## Context
### Architecture
The codebase follows a service layer pattern:
- Services are in `src/services/`
- Each service has `create()`, `update()`, `delete()` methods
- Use dependency injection for database connections

For this task, create a new `AuthService` following this pattern.
```

### Decision Context
**When needed:**
- Task is constrained by prior architectural decisions
- Technology choices limit implementation options
- Team standards or conventions apply

**How to pass:**
```markdown
## Context
### Decisions
Per security review #123, we must:
- Use bcrypt for password hashing (12 rounds)
- Implement rate limiting on auth endpoints
- Never store plain-text passwords
```

### Security Context
**When needed:**
- Task involves authentication, authorization, or PII
- Task handles sensitive data
- Task introduces new security considerations

**How to pass:**
```markdown
## Context
### Security Considerations
This task handles user authentication:
- All passwords must be hashed before storage
- Never log or expose authentication tokens
- Validate all inputs (username, password format)
- Implement rate limiting to prevent brute force attacks
```

## 5. Example: Complete Invocation

### Scenario
Command asks developer to implement a user authentication service.

### Command → Developer Prompt

```markdown
# Task Execution Request

## Task Information
**Task Name:** Implement user authentication service
**Purpose:** Add JWT-based authentication to protect API endpoints and enable user login/logout functionality

## Context
### Architecture
The codebase follows a service layer pattern:
- Services are in `src/services/`
- Each service has `create()`, `update()`, `delete()` methods
- Services use dependency injection for database connections (DBClient interface)

### Decisions
Per security review #123:
- Use bcrypt for password hashing (12 rounds)
- Implement rate limiting on auth endpoints
- Never store plain-text passwords

### Security Considerations
This task handles user authentication:
- All passwords must be hashed before storage
- Never log or expose authentication tokens
- Validate all inputs (username: 3-20 chars, password: 8+ chars)
- Implement rate limiting to prevent brute force attacks

## Task Steps
1. Create `src/services/AuthService.ts` with authenticate(), hashPassword(), verifyPassword() methods
2. Create `src/middleware/auth.ts` with JWT verification middleware
3. Add POST /auth/login endpoint to `src/routes/auth.ts`
4. Add POST /auth/logout endpoint to `src/routes/auth.ts`
5. Test authentication flow (login → protected endpoint → logout)

## Files to Modify
- `src/services/AuthService.ts` - Create new authentication service
- `src/middleware/auth.ts` - Create JWT verification middleware
- `src/routes/auth.ts` - Create auth endpoints
- `src/index.ts` - Add auth routes to app
- `package.json` - Add dependencies: jsonwebtoken, bcrypt

## Additional Context
- Use existing DBClient interface for database operations
- JWT secret should be from environment variable JWT_SECRET
- Token expiration: 24 hours
- Store user sessions in Redis (already configured)
```

### Developer Output (Success)

```markdown
✅ **Task Completed:** Implement user authentication service

**Files Modified:**
- `src/services/AuthService.ts` - Created authentication service with hashPassword, verifyPassword, authenticate methods
- `src/middleware/auth.ts` - Created JWT verification middleware with error handling
- `src/routes/auth.ts` - Created login/logout endpoints
- `src/index.ts` - Added auth routes to app
- `package.json` - Added jsonwebtoken and bcrypt dependencies

**Summary:**
Implemented JWT-based authentication with bcrypt password hashing. Added login endpoint that issues tokens (24h expiration) and logout endpoint that invalidates Redis sessions. Auth middleware validates tokens and attaches user to request. All inputs validated and rate limiting applied.
```

## 6. Developer Agent Contract

### Developer Agent Responsibilities

**The Developer Agent MUST:**

1. **Execute the task** according to the provided steps
2. **Follow all context** (architecture, decisions, security)
3. **Provide structured output** in one of the three formats (success/failure/blocked)
4. **Modify only specified files** unless the task explicitly requires new files
5. **Return explicit status** so the command can orchestrate next steps

**The Developer Agent MUST NOT:**

1. **Read plan files** - all context must be passed in the prompt
2. **Manage checkboxes** - not the developer's responsibility
3. **Call committer** - command will handle git operations
4. **Make architectural decisions** without context - ask command if unsure
5. **Orchestrate loops** - command handles multiple tasks

### What Makes This Design Better

1. **Separation of Concerns:**
   - Command: Orchestrates workflow, manages state
   - Developer: Implements individual tasks

2. **Reusability:**
   - Developer can be used for planned tasks OR ad-hoc tasks
   - Same interface works for both cases

3. **Explicit Contract:**
   - Clear input format (task, purpose, context, steps, files)
   - Clear output format (status, files, summary)
   - No implicit expectations

4. **Testability:**
   - Easy to unit test: input prompt → output status
   - Easy to mock for integration tests

5. **Error Handling:**
   - Explicit failure/blocked status enables proper error recovery
   - Command can retry, skip, or report based on status

## 7. Implementation Checklist

To implement this new interface:

- [ ] Update `pragmatic-implementation.md` to use this prompt template
- [ ] Update `pragmatic-developer.md` to expect this prompt format
- [ ] Update `pragmatic-developer.md` to return structured output
- [ ] Add example invocations to `README.md`
- [ ] Test with planned tasks
- [ ] Test with ad-hoc tasks
- [ ] Verify error handling (failure, blocked)
