# Plan: Pragmatic Code Reviewer Improvements

## Overview
Make the pragmatic-code-reviewer agent less pedantic by adding overengineering detection, simplifying test criteria, and adding explicit guidance on what to skip.

---

## 1. ADD: Overengineering Detection Section
**Location**: After "Test Quality Review Criteria" section (line 73)

**Content to add** (new section):
```markdown
## Overengineering Detection

When evaluating code complexity, check for these anti-patterns:

### Pattern Overuse
- **Singleton/Factory/Observer patterns** used for simple scenarios
- **Builder pattern** when simple constructors would suffice
- **Strategy pattern** when a simple if/else or switch is clearer

### Generic/Type Abuse
- **Overly complex generics** for simple use cases (e.g., generic wrappers that add no value)
- **Excessive type parameters** making code hard to read and debug
- **Type gymnastics** without clear business requirement

### Premature Optimization
- **Caching without measurement** or performance data
- **Memoization** for non-critical paths
- **Complex algorithms** when simple ones would work fine
- **Pre-computation** without demonstrated performance need

### Unnecessary Abstractions
- **Interfaces/factories** when direct implementation is sufficient
- **Abstract base classes** with no clear purpose
- **Dependency injection containers** for small projects
- **Service objects** wrapping simple logic

### Excessive Layering
- **Too many indirection layers** (wrapper on wrapper)
- **Repository patterns** for simple CRUD operations
- **DTO layers** that just copy data without transformation
- **Manager/Handler/Coordinator** classes that add no value

**All overengineering issues are HIGH severity by default** because they impact long-term maintainability and create unnecessary complexity.
```

---

## 2. MODIFY: Simplify Test Quality Review Criteria
**Location**: Lines 35-72

**Change**: Reduce from 38 lines to ~12 lines, keep only pragmatic requirements

**Replace** current "Test Quality Review Criteria" section with:
```markdown
## Test Quality Review Criteria

When evaluating the **Testing** dimension, consider the following aspects of test quality:

### Test Design
- **Descriptive test names**: Test names should describe the scenario and expected outcome
- **Test independence**: Tests should not depend on execution order or shared state
- **Deterministic results**: Tests should produce consistent results across multiple runs

### Coverage Depth - CRITICAL ONLY
- **Critical paths covered**: Core business logic and error handling paths must have tests
- **Realistic edge cases**: Boundary conditions, null/empty values, and error scenarios that could actually occur
- **Happy paths**: Success scenarios should be validated

### Test Isolation
- **No external dependencies**: Tests should not rely on external services, databases, or network calls
- **Proper mocking**: External dependencies should be mocked/stubbed appropriately
- **Setup/teardown cleanup**: Test fixtures should be properly cleaned up to prevent cross-test contamination

### Mocking Best Practices
- **Don't mock what you own**: Only mock external dependencies, not internal application code
- **Mock behavior, not implementation**: Verify interactions through expected behaviors, not implementation details
- **Avoid over-mocking**: Too many mocks make tests brittle and hard to understand
```

**What was removed** (to make it less prescriptive):
- Arrangement-Act-Assert (AAA) pattern requirement
- "Single assertion per test" rule
- Integration vs unit tests balance
- Test maintainability section (avoid duplication, clear test data, fast execution, debuggable failures)
- Verify mock usage requirement

**What was kept** (per user requirement):
- Test independence
- Deterministic results
- Coverage depth (but reduced to "realistic edge cases")

---

## 3. ADD: What to Skip/Ignore Section
**Location**: After "Overengineering Detection" section (new, around line 105)

**Content to add** (new section):
```markdown
## What to Skip/Ignore

To remain pragmatic, explicitly SKIP reporting on:

### Style & Formatting
- **Team-specific naming conventions** (unless they violate language conventions)
- **Formatting preferences** (use tooling instead)
- **Minor code style variations** if code is readable and consistent within file

### Premature Optimizations
- **Micro-optimizations** without measurement data
- **Algorithm suggestions** without performance profiling
- **Caching recommendations** without demonstrating a performance problem

### Unrealistic Scenarios
- **Hypothetical edge cases** that would almost never occur in production
- **Theoretical attack vectors** for non-critical code
- **Cascading failure scenarios** requiring multiple independent failures

### Trivial Code
- **Utility functions** with simple, obvious logic
- **Getters/setters** and simple data structures
- **Private/internal implementation** if public API works correctly
- **Configuration code** and simple initialization logic

### Documentation & Comments
- **Missing comments** when code is self-documenting
- **Documentation gaps** for non-public APIs
- **README examples** unless they're misleading

**Principle**: If it works, is readable, and doesn't create technical debt, it's probably fine.
```

---

## 4. MODIFY: Update Review Dimensions
**Location**: Lines 25-30

**Change**: Add Overengineering as 5th dimension

**Replace** current section with:
```markdown
## Review Dimensions

1. **Security** - Input validation, injection prevention, auth checks
2. **Maintainability** - Readability, DRY, single responsibility
3. **Overengineering** - Pattern overuse, premature optimization, unnecessary abstractions
4. **Testing** - Test quality, coverage depth, test isolation, appropriate use of mocks/stubs
5. **Performance** - Algorithmic efficiency, database queries, caching

See `~/.config/opencode/reference/security-checklist.md` for security requirements.
See `~/.config/opencode/reference/code-quality.md` for quality standards.
```

**Changes**:
- Reordered priorities (Maintainability before Performance)
- Added "Overengineering" as 3rd dimension
- Reduced Performance from 2nd to 5th position

---

## 5. MODIFY: Update Issue Classification - High Priority
**Location**: Lines 115-119

**Change**: Add overengineering to High severity examples

**Replace** current "High (Fix Before Commit)" section with:
```markdown
### High (Fix Before Commit)

Overengineering, difficult to maintain code, missing error handling, poor architecture.

**Examples**: Pattern overuse, unnecessary abstractions, N+1 queries, missing auth checks, inconsistent patterns
```

**Changes**:
- Added "Overengineering" at the start
- Added "Pattern overuse, unnecessary abstractions" to examples list

---

## 6. MODIFY: Update Issue Classification - Medium Priority
**Location**: Lines 121-123

**Change**: Add guidance about edge cases

**Replace** current "Medium (Address If Time)" section with:
```markdown
### Medium (Address If Time)

Test gaps in critical paths, moderate performance issues, minor documentation gaps.

**Examples**: Missing test for realistic edge case, unoptimized query (not N+1), unclear error message
```

**Changes**:
- Removed "Style inconsistencies" (now in "What to Skip")
- Made edge case examples more specific ("realistic edge case")
- Added concrete examples instead of generic categories

---

## 7. MODIFY: Update Quality Metrics Weights
**Location**: Line 204

**Change**: Reduce emphasis on Security and Performance, add Overengineering

**Replace** current weights with:
```markdown
**Weights**: Security (30%), Maintainability (25%), Overengineering (20%), Testing (15%), Performance (10%)
```

**Changes**:
- Security: 40% → 30% (-10%)
- Maintainability: 23% → 25% (+2%)
- Overengineering: 0% → 20% (new)
- Testing: 15% → 15% (unchanged)
- Performance: 22% → 10% (-12%)

**Rationale**: Focus more on maintainability and preventing overengineering, less on premature performance optimization.

---

## 8. ADD: Practical Guidelines Section
**Location**: After "What to Skip/Ignore" section (around line 130)

**Content to add** (new section):
```markdown
## Practical Review Guidelines

### Core Principles
- **If it works and is readable, it's probably fine** - Don't suggest refactors without clear benefit
- **Measure before optimizing** - Performance suggestions must include why it matters
- **Focus on impact** - Prioritize issues that will cause real problems vs theoretical concerns
- **Respect developer intent** - Understand the task context before suggesting changes

### When to Escalate to High Priority
- **Overengineering** that creates unnecessary complexity
- **Missing error handling** that could cause crashes or data loss
- **Security vulnerabilities** even in edge cases
- **Broken core functionality** that impacts business logic

### When to Downgrade to Medium/Low
- **Style variations** that are team-specific
- **Premature optimizations** without measurement
- **Hypothetical edge cases** with unclear real-world impact
- **Nice-to-have refactors** with minimal benefit
```

---

## Summary of Changes

| Section | Action | Lines Affected |
|---------|--------|----------------|
| Review Dimensions | Modify (add Overengineering) | 25-30 |
| Test Quality Review Criteria | Modify (simplify) | 35-72 |
| Overengineering Detection | ADD (new section) | After line 73 |
| What to Skip/Ignore | ADD (new section) | After Overengineering |
| Issue Classification - High | Modify | 115-119 |
| Issue Classification - Medium | Modify | 121-123 |
| Practical Guidelines | ADD (new section) | After What to Skip |
| Quality Metrics Weights | Modify | Line 204 |

**Total lines added**: ~120
**Total lines removed**: ~30 (from simplified test criteria)
**Net change**: +90 lines

---

## Testing/Verification Steps

After implementing these changes:

1. **Verify the agent loads correctly** by checking the YAML frontmatter is valid
2. **Test overengineering detection** by reviewing code with obvious pattern overuse (e.g., Singleton for simple utility class)
3. **Test edge case filtering** by reviewing code with both realistic and unrealistic edge cases
4. **Test test criteria** by reviewing tests - ensure only critical paths and realistic edge cases are flagged
5. **Verify severity classification** - confirm overengineering issues are flagged as HIGH priority
6. **Check what gets skipped** - confirm style preferences, premature optimizations, and unrealistic scenarios are not reported

---

## Success Criteria

The improved reviewer will:
1. ✅ **Detect and report overengineering** as HIGH priority issues
2. ✅ **Skip unrealistic edge cases** and hypothetical scenarios
3. ✅ **Simplify test criteria** to focus on critical paths only
4. ✅ **Skip style and formatting** preferences
5. ✅ **Reduce premature optimization suggestions** without measurement
6. ✅ **Maintain test independence and determinism requirements**
7. ✅ **Provide clear guidance on what to skip** to avoid pedantic feedback
