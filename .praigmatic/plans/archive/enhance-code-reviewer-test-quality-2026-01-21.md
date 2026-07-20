# Enhanced Code Reviewer Test Quality Implementation Plan

## Purpose

Enhance the pragmatic-code-reviewer agent to include comprehensive test quality review capabilities, ensuring unit and integration tests are evaluated for design, isolation, coverage depth, and maintainability.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** RUN
**Rationale:** Needed to understand existing agent patterns and how testing is handled across the codebase.

**Exploration findings:**
- pragmatic-committer only commits changes and doesn't review test quality
- pragmatic-developer has extensive TTD (Test-Then-Design) workflow
- pragmatic-code-reviewer is the correct agent to enhance
- Test quality review is currently under-specified (only 10% weight, minimal criteria)

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Requirements are clear - enhance pragmatic-code-reviewer to include comprehensive test quality review criteria.

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None
**Complexity assessment:** Small

### Phase 4: Research
**Decision:** SKIP
**Rationale:** Sufficient context from reading existing agent configurations. Changes are straightforward documentation updates requiring no external research.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research was conducted, so no synthesis needed.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 3
**Task size distribution:** Small: 3, Medium: 0, Large: 0

## Tasks

- [x] **Expand Testing Dimension Description** (Small)
  - Purpose: Update the Testing review dimension to reflect the comprehensive test quality criteria that will be reviewed
  - Steps:
    - Update line 31 in pragmatic-code-reviewer.md
    - Change from: "Coverage of critical paths, edge cases"
    - Change to: "Test quality, coverage depth, test isolation, test maintainability, appropriate use of mocks/stubs"
  - Files: `.opencode/agent/pragmatic-code-reviewer.md`
  - Dependencies: None

- [x] **Increase Testing Weight in Quality Metrics** (Small)
  - Purpose: Reflect the increased importance of test quality in overall code quality assessment
  - Steps:
    - Update line 166 in pragmatic-code-reviewer.md
    - Change testing weight from 10% to 15%
    - Adjust other weights proportionally: Security (40%), Performance (22%), Maintainability (23%), Testing (15%)
  - Files: `.opencode/agent/pragmatic-code-reviewer.md`
  - Dependencies: None

- [x] **Add Test Quality Review Criteria Section** (Small)
  - Purpose: Provide detailed criteria for evaluating test quality when reviewing code changes
  - Steps:
    - Insert new section "## Test Quality Review Criteria" after line 68 (after "## Issue Classification" section)
    - Add subsections: Test Design, Test Coverage, Test Maintainability, Mock/Stub Usage
    - Include specific criteria for each subsection (isolation, determinism, edge cases, test helpers, minimal mocking, etc.)
    - Add example good/bad test patterns where appropriate
  - Files: `.opencode/agent/pragmatic-code-reviewer.md`
  - Dependencies: None

## Architecture Overview

This enhancement updates the pragmatic-code-reviewer agent configuration file to expand its testing review capabilities. The changes are purely documentation and criteria definition - no code changes required. The reviewer will use these criteria when analyzing code changes that include test files.

## Technical Decisions

- **Decision 1**: Add new section instead of modifying existing sections
  - Rationale: Keeps changes organized and maintainable; existing reviewers won't break
  - Trade-offs: Adds slight length to config file, but improves clarity

- **Decision 2**: Increase testing weight from 10% to 15%
  - Rationale: Test quality is critical for long-term maintainability; 10% undervalues its importance
  - Trade-offs: Reduces weight of other dimensions slightly, but still maintains security as dominant factor

- **Decision 3**: Include both unit and integration test criteria
  - Rationale: Both test types require different quality considerations
  - Trade-offs: Increases documentation complexity, but provides comprehensive guidance

## Integration Points

- **Agent Configuration**: Only file modified is `.opencode/agent/pragmatic-code-reviewer.md`
- **Reviewer Workflow**: Phase 2 (Classification) will incorporate test quality criteria
- **Output Format**: Issues related to test quality will appear in Critical/High/Medium/Low sections
- **Quality Score**: Testing dimension will contribute 15% to overall score

## Security Considerations

None - this is purely documentation/criteria updates with no security implications.

## Testing Strategy

- **Verification**: Review the updated configuration file to ensure all sections are properly formatted
- **Smoke Test**: Simulate a code review with test file changes to verify new criteria are applied
- **Documentation Review**: Ensure criteria are clear and actionable for reviewers

## Risk Points

- **Risk 1**: Criteria may be too prescriptive or language-specific
  - Mitigation: Keep criteria language-agnostic where possible; avoid mandating specific frameworks
  - Fallback: Iterate on criteria based on reviewer feedback

- **Risk 2**: Increased testing weight may over-emphasize tests at expense of other quality dimensions
  - Mitigation: Monitor review outcomes; adjust weights if imbalance observed
  - Fallback: Revert to original weights if quality suffers in other dimensions

## Dependencies

- All three tasks are independent and can be completed in any order
- No external dependencies or prerequisites

## Implementation Notes

1. **Ordering**: Tasks are listed in logical order (expand description → adjust weight → add detailed criteria), but can be done in any sequence

2. **Format Consistency**: Follow existing markdown patterns in the file (section headers, bullet points, code examples)

3. **Criteria Design**: Test quality criteria should be:
   - **Observable**: Reviewer can determine from test code alone
   - **Actionable**: Clear what improvement looks like
   - **Language-agnostic**: Apply to Go, TypeScript, Python, etc.
   - **Balanced**: Not overly prescriptive but still meaningful

4. **Example Criteria to Include**:
   - Test isolation (no execution order dependencies)
   - Clear test names (describe what and why)
   - Minimal mocking (don't mock code under test)
   - Edge cases covered (boundary values, error conditions)
   - Test helpers/DRY principles
   - Deterministic (no flaky tests due to timing/randomness)

5. **Verification**: After making changes, read the file back to ensure edits were applied correctly
