# Enhance Pragmatic Researcher Agent Configuration

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** RUN
**Rationale:** Modifying existing agent configuration requires understanding patterns from other agents to ensure consistency across the system.
**Findings:** Analyzed pragmatic-explorer and pragmatic-developer configurations. Key patterns include: invocation context handling with [SUBAGENT] prefix, output format line limits, tool usage examples with code blocks, numbered workflow phases with checkpoints, best practices sections, and explicit anti-patterns.

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Request is clear and specific with explicit improvement areas identified in the analysis (Context7 usage guidelines, version tracking, development checklist, risk assessment). No ambiguity requiring clarification.

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None - All required information is available from the agent configuration analysis and best practices research.
**Complexity assessment:** Medium - Multiple sections to enhance, requires careful alignment with existing agent patterns, no external research or dependencies needed.

### Phase 4: Research
**Decision:** SKIP
**Rationale:** No research needed - I already analyzed the target file and compared it against patterns from other agents in the codebase. All improvements are based on established patterns from pragmatic-explorer and pragmatic-developer configurations.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research was conducted, so there are no findings to synthesize. Improvements are directly derived from the gap analysis between pragmatic-researcher and the patterns found in other agent configurations.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 6
**Task size distribution:** Small: 5, Medium: 1

## Tasks

- [x] **Enhance Core Principles** (Small) (NO_TTD)
  - Add "Version Awareness" principle after line 38
  - Text: "5. **Version Awareness**: Always check latest stable version, release notes, and breaking changes for development topics"
  - Place: `.opencode/agent/pragmatic-researcher.md`

- [x] **Clarify Context7 Usage Guidelines** (Medium) (NO_TTD)
  - Replace lines 42-52 with enhanced Context7 section
  - Add explicit "Programming Only" constraint in header
  - Add "When to use Context7" subsection with 3 bullet points (API refs, framework guides, version-specific docs, dev tools)
  - Add "When NOT to use Context7" subsection with 4 bullet points (general concepts, business domain, non-programming topics, non-code tool comparisons)
  - Keep existing pattern example but add best practice note about version components
  - Place: `.opencode/agent/pragmatic-researcher.md`

- [x] **Add Development Research Checklist** (Small) (NO_TTD)
  - Insert after Source Selection Guide (after line 99)
  - Add section header "## Development Research Checklist"
  - Add 7 checkbox items: Latest Version, Breaking Changes, Deprecations, Example Quality, Compatibility, Community Consensus, Official vs. Community
  - Follow format used in Quality Checklist section
  - Place: `.opencode/agent/pragmatic-researcher.md`

- [x] **Enhance Research Workflow** (Small) (NO_TTD)
  - Replace lines 83-89 with expanded workflow
  - Enhance step 1: Add "Identify if programming-related (triggers Context7)"
  - Enhance step 3: Add specific guidance "For development: Include Context7 + Grep.app + WebSearch" and "For general topics: Use Grep.app + WebSearch"
  - Enhance step 4: Add "Note information dates/recency"
  - Enhance step 5: Add "Highlight version-specific considerations" and "Flag potential risks or trade-offs"
  - Place: `.opencode/agent/pragmatic-researcher.md`

- [x] **Add Risk Assessment Section** (Small) (NO_TTD)
  - Insert after Quality Checklist (before line 142)
  - Add section header "## Risk Assessment"
  - Add intro sentence: "For development research, always identify:"
  - Add 6 risk categories with sub-bullets: Complexity Trade-offs, Performance Considerations, Security Implications, Maintenance Burden, Learning Curve, Maturity
  - Add risk format example with 4 fields: Risk, Likelihood, Impact, Mitigation
  - Follow style consistent with other sections
  - Place: `.opencode/agent/pragmatic-researcher.md`

- [x] **Add Tool Best Practices Section** (Small) (NO_TTD)
  - Insert after Risk Assessment (before final reference link at line 142)
  - Add section header "## Tool Best Practices"
  - Add subsection "### Grep.app Usage" with 4 bullets (code vs concepts search, filter by language/repo, regex for patterns, check commit dates)
  - Add subsection "### WebSearch Usage" with 4 bullets (include year, specific queries, source credibility, publication dates)
  - Add subsection "### Local Codebase Search" with 4 bullets (understand patterns first, check for similar functionality, identify integration points)
  - Follow format used in Source Selection Guide (table or structured bullets)
  - Place: `.opencode/agent/pragmatic-researcher.md`

## Architecture Overview

The pragmatic-researcher agent is a documentation and code research specialist that uses multiple tools (Context7, Grep.app, WebSearch, local codebase) to find up-to-date information. The enhancement improves development-specific research capabilities by:

1. **Explicit Context7 Constraints**: Clarifies when Context7 is appropriate (programming topics only)
2. **Version Awareness**: Ensures research considers latest versions, breaking changes, and deprecations
3. **Development Checklist**: Standard verification steps for programming-related research
4. **Risk Assessment**: Structured approach to identifying trade-offs in implementation choices
5. **Tool Best Practices**: Specific guidance for optimal tool usage

## Technical Decisions

- **Context7 Programming-Only Constraint**: Restricts Context7 usage to programming topics only, distinguishing from general knowledge research
  - Rationale: Context7 is optimized for library/framework documentation, not general concepts
  - Trade-offs: More explicit guidance but requires agent to make categorization decisions

- **Development Checklist**: Added comprehensive 7-item checklist for development research
  - Rationale: Ensures consistency in version tracking and quality verification
  - Trade-offs: Additional verification steps improve accuracy but may add processing time

- **Risk Assessment Structure**: Added structured format with likelihood/impact/mitigation fields
  - Rationale: Consistent risk evaluation helps developers make informed decisions
  - Trade-offs: More comprehensive but requires researcher to assess likelihood/impact

- **Tool-Specific Best Practices**: Added explicit guidance for each major tool
  - Rationale: Improves query quality and results relevance
  - Trade-offs: More detailed instructions may increase complexity

## Integration Points

- **Single file modification**: Only `.opencode/agent/pragmatic-researcher.md` is affected
- **No breaking changes**: All additions are new sections or enhancements, no deletion of existing functionality
- **Consistent patterns**: Follows patterns from pragmatic-explorer and pragmatic-developer configurations
- **Tool permissions**: No changes required to tool permissions (read, grep, glob, webfetch, websearch, skill remain the same)

## Security Considerations

- **No security changes**: Enhancement is about research methodology, not tool access or permissions
- **Source verification**: Existing multi-source verification principle already addresses credibility
- **Code example safety**: No code execution, only research and documentation

## Testing Strategy

- **Manual verification**: Review each added section for clarity and completeness
- **Pattern consistency**: Verify enhancements align with pragmatic-explorer and pragmatic-developer patterns
- **Format validation**: Ensure markdown formatting and indentation is correct
- **Reference check**: Verify all section references and line numbers after edits

## Risk Points

- **Context7 categorization errors**: Agent might incorrectly categorize topics as programming/non-programming
  - Mitigation: Clear when/when-not examples minimize confusion
  - Fallback: Agent can still use WebSearch as backup for ambiguous cases

- **Line number drift**: After first edit, subsequent line numbers may shift
  - Mitigation: Edit sections in order (top to bottom) to minimize impact
  - Fallback: Use read tool to verify current content before each edit

- **Over-engineering**: Too many additions could make the configuration verbose
  - Mitigation: Keep bullet points concise and actionable
  - Fallback: User feedback can guide further simplification if needed

## Dependencies

- **Sequential order**: Tasks should be completed in order to manage line number references
- **Task 2 depends on Task 1**: Clarifying Context7 usage should come after adding version awareness principle
- **Tasks 3-6**: Can be completed after Task 2 in any order, but following listed order minimizes line number adjustments
- **No external dependencies**: No research, library installations, or external systems required

## Implementation Notes

- **Line number references**: Current line numbers are based on the file read. After each edit, verify remaining line numbers with read tool.
- **Markdown formatting**: Maintain consistent indentation (2 spaces for sub-bullets) and heading levels (## for main sections, ### for subsections)
- **Code block style**: Use backticks with language identifiers for code examples (e.g., ````typescript`)
- **Checkbox format**: Use `- [ ]` for checkbox items, consistent with existing Quality Checklist section
- **Consistent terminology**: Use terms found in other agents (e.g., "Core Principles", "Best Practices", "Workflow")
- **Pattern alignment**: Reference pragmatic-explorer's structure (invocation context, when to use) and pragmatic-developer's style (numbered workflow, checkpoint verification)
