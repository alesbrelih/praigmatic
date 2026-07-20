# SamoBracic Project Manager Agent Implementation Plan

## Purpose

Create a new OpenCode agent called "SamoBracic" that serves as a project manager by breaking down complex requirements into epics and user stories. The agent will help users organize large, ambiguous tasks into manageable, functional pieces that can be built iteratively.

## Tasks

- [x] **Create SamoBracic Agent File and Validate Configuration** (Small)
  - Purpose: Create the agent markdown file with proper OpenCode configuration and immediately validate setup
  - Steps:
    - Create `.opencode/agent/samo-bracic.md` file
    - Add YAML frontmatter with agent metadata (description, mode, model, permissions, tools)
    - Configure as primary agent (mode: all) to allow direct user invocation
    - Set appropriate permissions (read, grep, glob, question, task tools) with restricted agent calls:
      ```yaml
      permission:
        edit: deny
        write: deny
        bash: deny
        task:
          "*": deny
          pragmatic-explorer: allow
          pragmatic-brainstormer: allow
      ```
    - Write agent description emphasizing project management capabilities
    - Immediately validate configuration: check YAML syntax, verify file location, compare with existing agent files (pragmatic-brainstormer.md)
    - Ensure agent description appears in agent list
  - Files: `.opencode/agent/samo-bracic.md`
  - Dependencies: None
  - Provides for Future Tasks: Agent file with validated configuration ready for prompt content
  - Success Criteria: YAML frontmatter valid and complete, agent appears in agent list, permissions correctly specified

- [x] **Define Agent Purpose and Role** (Small)
  - Purpose: Document what SamoBracic does and when to use it
  - Steps:
    - Write Purpose section explaining the agent's role as a project manager
    - Define When to Use section for common scenarios (large features, ambiguous requirements, multi-phase projects)
    - Document target users (product managers, tech leads, developers planning complex features)
    - Explain difference between epics and user stories
  - Files: `.opencode/agent/samo-bracic.md`
  - Dependencies: Create SamoBracic Agent File
  - Provides for Future Tasks: Clear understanding of agent's role and usage

- [x] **Design Task Breakdown Process** (Medium)
  - Purpose: Define how SamoBracic will analyze and decompose complex tasks
  - Steps:
    - Create Phase 1: Analyze Request section with steps for understanding requirements
      - Example markdown:
        ```markdown
        ### Phase 1: Analyze Request

        **Steps:**
        1. Identify core functionality requested
        2. Recognize implicit requirements (security, performance, UX)
        3. Identify key user roles and use cases
        4. Determine technical scope and constraints
        ```
    - Define Phase 2: Ask Questions section using question tool for clarification
    - Create Phase 3: Structure Epics section explaining how to group related work
    - Define Phase 4: Create User Stories section with story format requirements
    - Add Phase 5: Prioritize and Order section for dependency management
    - Note: This task and Task 4 (Define Epic and User Story Format) can run in parallel
  - Files: `.opencode/agent/samo-bracic.md`
  - Dependencies: Define Agent Purpose and Role
  - Provides for Future Tasks: Structured process for breaking down tasks
  - Success Criteria: Process includes 5 phases with 3-5 steps per phase, each step has clear purpose

- [x] **Define Epic and User Story Format** (Medium)
  - Purpose: Establish clear structure for epics and user stories
  - Steps:
    - Create Epic format section with fields (name, description, goals, user stories list)
      - Example markdown:
        ```markdown
        ## Epic: User Authentication

        **Description**: Enable users to create accounts and log in

        **Goals**:
        - Secure user authentication
        - Support multiple login methods
        - Session management

        **User Stories**:
        - [ ] User Registration
        - [ ] User Login
        - [ ] Password Reset
        ```
    - Define User Story format section with required fields:
      - Title (clear, functional)
      - As a [role]
      - I want [feature]
      - So that [value]
      - Acceptance criteria (bullet list of "done" conditions)
      - Dependencies (what must be built first)
    - Provide examples for both epics and user stories
    - Add guidelines for breaking down stories (INVEST criteria: Independent, Negotiable, Valuable, Estimable, Small, Testable)
    - Note: This task and Task 3 (Design Task Breakdown Process) can run in parallel
  - Files: `.opencode/agent/samo-bracic.md`
  - Dependencies: Define Agent Purpose and Role
  - Provides for Future Tasks: Clear output format for generated stories
  - Success Criteria: Format includes all required fields (name, description, goals, acceptance criteria) with 2 complete examples

- [x] **Implement Agent Integration Workflow** (Medium)
  - Purpose: Define how SamoBracic integrates with other agents and systems
  - Steps:
    - Document invocation patterns (direct user invocation, subagent invocation by planner/developer)
    - Create Workflow Examples section showing typical scenarios
      - Example workflow:
        ```markdown
        ## Workflow Example 1: Authentication Feature

        **User Request**: "Add authentication to our web app"

        **Step 1**: Call pragmatic-explorer to understand current stack (Express.js, PostgreSQL)

        **Step 2**: Ask user about authentication method (OAuth, email/password, both)

        **Step 3**: Create epics based on scope
          - Epic: User Registration
          - Epic: User Login
          - Epic: Password Reset

        **Step 4**: Generate user stories for each epic
          - Story: User can register with email/password
          - Story: User can log in
          - Story: User can reset password via email
        ```
    - Add Integration with Other Agents section explaining when to call pragmatic-explorer or pragmatic-brainstormer
    - Define Output Format section with markdown structure for epics/user stories
    - Add error handling for unclear requirements or insufficient context
  - Files: `.opencode/agent/samo-bracic.md`
  - Dependencies: Define Epic and User Story Format
  - Provides for Future Tasks: Clear integration patterns for agent usage

- [x] **Add Best Practices and Examples** (Small)
  - Purpose: Provide guidance and examples for effective story breakdown
  - Steps:
    - Create Best Practices section with tips for story creation
    - Add Common Patterns section (CRUD operations, UI features, API endpoints, etc.)
    - Include Anti-Patterns section with specific examples:
      - "Story too large (>3 days work) - e.g., 'Build entire admin panel'"
      - "Story too small (<2 hours) - e.g., 'Add one CSS class'"
      - "Acceptance criteria subjective - e.g., 'Make it look good' vs 'Page loads in <2 seconds'"
      - "Missing 'so that' value - e.g., 'As a user I want to log in' (why?)"
    - Provide 2-3 complete workflow examples showing full breakdown process
    - Add troubleshooting guide for common issues
  - Files: `.opencode/agent/samo-bracic.md`
  - Dependencies: Implement Agent Integration Workflow
  - Provides for Future Tasks: Comprehensive reference for users
  - Success Criteria: Includes 5+ best practices, 4+ common patterns, 4+ anti-patterns with examples, 2-3 complete workflow examples

- [x] **Document Unit Test Scenarios** (Medium)
  - Purpose: Document test scenarios for validating agent's core logic
  - Steps:
    - Create test scenario documentation for epic grouping logic (correctly groups related features)
    - Create test scenario documentation for story formatting (all required fields present)
    - Create test scenario documentation for INVEST criteria validation (Independent, Negotiable, Valuable, Estimable, Small, Testable)
    - Create test scenario documentation for dependency identification between stories
    - Document at least 10 test scenarios covering core logic paths
  - Files: `.opencode/agent/samo-bracic.md`, test scenario documentation in agent file
  - Dependencies: Design Task Breakdown Process, Define Epic and User Story Format
  - Provides for Future Tasks: Test scenarios ready for validation and manual testing
  - Success Criteria: 10+ test scenarios documented covering epic grouping, story formatting, INVEST validation, and dependency identification

- [x] **Document Integration Test Scenarios** (Medium)
  - Purpose: Document test scenarios for SamoBracic's integration with other agents
  - Steps:
    - Create test scenario documentation for calling pragmatic-explorer for codebase context
    - Create test scenario documentation for calling pragmatic-brainstormer for technical clarifications
    - Create test scenario documentation for permission boundary validation (refuses to call implementation agents)
    - Create test scenario documentation for question tool integration
    - Create test scenario documentation for preventing infinite loops or excessive agent calls
    - Document at least 8 integration test scenarios
  - Files: `.opencode/agent/samo-bracic.md`, integration test scenario documentation in agent file
  - Dependencies: Implement Agent Integration Workflow
  - Provides for Future Tasks: Integration test scenarios ready for validation
  - Success Criteria: 8+ integration test scenarios documented covering all agent integrations and permission boundaries

- [x] **Document End-to-End Test Scenarios** (Medium)
  - Purpose: Document test scenarios for full agent workflow from requirement input to epic/user story output
  - Steps:
    - Create test scenario documentation for complete workflow: User request → Questions/Exploration → Epics → User Stories
    - Create test scenario documentation for simple requirements (1-2 epics, 3-5 stories)
    - Create test scenario documentation for medium requirements (3-5 epics, 8-12 stories)
    - Create test scenario documentation for complex requirements (5+ epics, 15+ stories)
    - Create test scenario documentation for edge cases (vague requirements, conflicting goals, insufficient context)
    - Document at least 6 end-to-end test scenarios
  - Files: `.opencode/agent/samo-bracic.md`, e2e test scenario documentation in agent file
  - Dependencies: Add Best Practices and Examples
  - Provides for Future Tasks: End-to-end test scenarios ready for validation
  - Success Criteria: 6+ e2e test scenarios documented covering simple, medium, complex, and edge case requirements

- [x] **Create User Documentation** (Small)
  - Purpose: Document agent usage for users
  - Steps:
    - Create README or usage guide section in agent file
    - Document invocation patterns (Tab key, @SamoBracic)
    - Provide example workflows with sample inputs and outputs
    - Document integration with pragmatic-explorer and pragmatic-brainstormer
    - Add troubleshooting section for common issues
  - Files: `.opencode/agent/samo-bracic.md`
  - Dependencies: Document End-to-End Test Scenarios
  - Provides for Future Tasks: User-friendly documentation for agent adoption
  - Success Criteria: Documentation includes 3+ example workflows, clear invocation instructions, troubleshooting guide
  - Provides for Future Tasks: Validated agent ready for use

## Architecture Overview

SamoBracic is a primary OpenCode agent that operates as a project manager, breaking down complex tasks into structured epics and user stories. It integrates with the existing pragmatic-* agent ecosystem but focuses on a different level of abstraction:

- **Input Level**: Complex requirements (e.g., "Build an e-commerce platform")
- **Output Level**: Epics and user stories (e.g., "Epic: User Management" → "Story: User Registration")

**Agent Hierarchy:**
```
SamoBracic (Project Manager)
  - Breaks down complex tasks into epics/user stories
  - May call pragmatic-explorer for codebase context
  - May call pragmatic-brainstormer for clarifying requirements
  - Output feeds into pragmatic-planner for detailed task breakdown

Pragmatic Planner (Implementation Planner)
  - Takes user stories as input
  - Creates detailed implementation tasks
  - Breaks down into actionable steps
```

**Key Components:**
1. **Analysis Engine**: Understands complex requirements and identifies key components
2. **Question Framework**: Uses question tool to clarify ambiguous requirements
3. **Epic Structure**: Groups related functionality into logical epics
4. **Story Template**: Creates functional, testable user stories with acceptance criteria
5. **Dependency Graph**: Identifies and documents dependencies between stories

## Technical Decisions

- **Agent Mode**: `mode: all` (primary agent)
  - Rationale: Users should be able to directly invoke SamoBracic via Tab key for project planning sessions
  - Trade-offs: Higher cognitive load for users, but provides flexibility for ad-hoc planning

- **Tools**: read, grep, glob, question, task
  - Rationale: Needs to understand codebase (read/grep/glob), ask questions (question), and potentially call other agents (task)
  - Trade-offs: Limited permissions ensure agent focuses on planning, not implementation

- **Permissions**: Deny edit, write, bash; allow specific read-only operations and restricted agent calls
  - Rationale: Project manager should not modify code, only plan and structure work. Agent calls should be restricted to only safe exploration and clarification agents.
  - Trade-offs: Cannot create artifacts (e.g., markdown files), but maintains clear separation of concerns between planning and implementation.
  - **Configuration Details**: The task tool permissions should restrict calls to only safe agents:
    ```yaml
    permission:
      edit: deny
      write: deny
      bash: deny
      task:
        "*": deny
        pragmatic-explorer: allow
        pragmatic-brainstormer: allow
    ```
    This prevents the agent from calling implementation agents directly, maintaining clear separation between planning and implementation.

- **Output Format**: Markdown with structured sections
  - Rationale: Compatible with existing OpenCode patterns and human-readable
  - Trade-offs: Less machine-parseable than JSON, but more flexible and easier to edit

## Integration Points

**File Locations:**
- Primary: `.opencode/agent/samo-bracic.md`
- Agent identifier: `samo-bracic` (from filename)

**Agent Invocations:**
- Direct user invocation: `@SamoBracic` or Tab switch
- Subagent invocation: `task(agent: "samo-bracic", prompt: "[SUBAGENT] Break down this requirement")`

**Called Agents:**
- `pragmatic-explorer`: For codebase analysis when planning features in existing systems
- `pragmatic-brainstormer`: For clarifying technical decisions or architectural choices

**Calling Agents:**
- `pragmatic-planner`: May use SamoBracic output as input for detailed planning
- User workflows: Direct invocation for project planning sessions

**Data Flow:**
```
User Request → SamoBracic → [Questions/Exploration] → Epics + User Stories → [Optional] Pragmatic Planner → Implementation Tasks
```

## Security Considerations

- **No Code Modification**
  - Risk: Agent might accidentally modify codebase
  - Mitigation: Explicitly deny edit/write/bash permissions, allow only read operations

- **Information Disclosure**
  - Risk: Agent might read sensitive files (e.g., .env, credentials)
  - Mitigation: Restrict to read, grep, glob with project-scope permissions; document not to share sensitive details

- **Agent Injection**
  - Risk: Malicious prompt could cause agent to call other agents inappropriately
  - Mitigation: Restrict task tool permissions to only safe agents (explorer, brainstormer)

- **Output Validation**
  - Risk: Generated stories might include security-sensitive requirements not properly scoped
  - Mitigation: Add guidelines in agent prompt to identify security considerations and document them in stories

## Testing Strategy

- **Configuration Validation**
  - Verify YAML frontmatter is valid
  - Check agent appears in agent list
  - Test file path and naming conventions

- **Invocation Testing**
  - Test direct user invocation (if environment allows)
  - Test subagent invocation from other agents
  - Verify tool permissions work correctly

- **Output Format Testing**
  - Generate sample epics/user stories for known requirements
  - Verify output matches defined format
  - Check acceptance criteria are clear and testable

- **Integration Testing**
  - Test calling pragmatic-explorer for context
  - Test calling pragmatic-brainstormer for clarification
  - Verify output can be used by pragmatic-planner

- **Edge Cases**
  - Handle extremely complex requirements (multiple epics, many stories)
  - Handle vague or insufficient requirements (questions mechanism)
  - Handle conflicting or unclear user goals

## Risk Points

- **Ambiguous Requirements**
  - Risk: User provides very vague input (e.g., "make it better")
  - Mitigation: Implement robust question framework to clarify intent
  - Fallback: Request user provide more specific context or examples

- **Over-Decomposition**
  - Risk: Breaking down into too many small stories (planning paralysis)
  - Mitigation: Follow INVEST criteria, focus on functional pieces
  - Fallback: Group related stories into larger epics

- **Under-Decomposition**
  - Risk: Stories too large or complex (not buildable in one iteration)
  - Mitigation: Validate stories are small and testable; provide examples
  - Fallback: Ask user if story should be broken down further

- **Context Gap**
  - Risk: Agent doesn't understand codebase or technical constraints
  - Mitigation: Integrate with pragmatic-explorer to gather context
  - Fallback: Ask user about technical stack and constraints

## Dependencies

- Task dependencies: Sequential creation, then parallel execution:
  - Task 1: Agent file creation + validation (foundation)
  - Task 2: Purpose documentation (depends on Task 1)
  - Tasks 3 & 4: Process design and format definition (parallel, depend on Task 2)
  - Tasks 5 & 6: Integration workflow and best practices (sequential, depend on Tasks 3 & 4)
  - Tasks 7, 8, 9, 10: Unit, integration, e2e tests, documentation (parallel, depend on Task 6)
- External dependencies: None (uses only existing OpenCode infrastructure)

## Implementation Notes

**Agent File Structure:**
```markdown
---
description: Project manager that breaks down complex requirements into epics and user stories
mode: all
model: zai-coding-plan/glm-4.7
permission:
  edit: deny
  write: deny
  bash: deny
  task:
    "*": deny
    pragmatic-explorer: allow
    pragmatic-brainstormer: allow
tools:
  read: true
  grep: true
  glob: true
  question: true
---

# SamoBracic - Project Manager Agent

[Prompt content follows similar structure to pragmatic-brainstormer]
```

**Permission Validation in Implementation:**
Agent implementation must validate target agent before making task() calls:
```markdown
Before calling task(agent: "..."), validate:
1. Target agent is in allowed list (pragmatic-explorer, pragmatic-brainstormer)
2. Call is appropriate for project management role
3. No attempt to call implementation agents directly
```

Add this validation to agent prompt and include in integration tests.

**Story Format Example:**
```markdown
## Epic: User Authentication

**Description**: Enable users to create accounts and log in to access protected features

**Goals**:
- Secure user authentication
- Support multiple login methods
- Session management

### User Story: User Registration

**As a** new user
**I want to** create an account with email and password
**So that** I can access the application features

**Acceptance Criteria**:
- User can enter email and password
- Password must meet complexity requirements (8+ chars, uppercase, number, special char)
- Email validation checks format and uniqueness
- Account is created successfully upon valid input
- User receives confirmation email
- User is logged in automatically after registration
- Error messages are clear and actionable

**Dependencies**: None
**Priority**: High
```

**Key Guidelines:**
- User stories should be functional and deliver value when complete
- Each story should be buildable/testable in one iteration
- Acceptance criteria must be specific and verifiable
- Dependencies should be explicit between stories
- Stories should follow INVEST principles

**Question Framework:**
When breaking down tasks, ask questions to clarify:
1. **Scope**: What's the minimal viable version?
2. **Users**: Who are the target users?
3. **Value**: What's the primary value being delivered?
4. **Constraints**: Technical, time, or budget constraints?
5. **Priority**: Which features are most critical?

**Integration with Existing Agents:**
- Use `pragmatic-explorer` when planning features for existing codebases to understand patterns
- Use `pragmatic-brainstormer` when multiple technical approaches exist for a feature
- Output can be fed to `pragmatic-planner` for detailed task breakdown

**File Naming:**
- Agent file: `.opencode/agent/samo-bracic.md`
- Agent identifier: `samo-bracic` (from filename, used in task() calls)
- This follows the existing pattern where filename = agent ID
