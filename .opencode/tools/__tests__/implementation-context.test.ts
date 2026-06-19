import { describe, expect, it } from "vitest";
import type { ParsedPlan } from "../lib/plan-workflow.js";
import {
  buildHolisticContext,
  buildRetryIssuePacket,
  estimatePacketSize,
  selectReviewContext,
  selectTaskContext,
  type CompletedTaskExecution,
} from "../lib/implementation-context.js";

const basePlan: ParsedPlan = {
  path: "/tmp/plan.md",
  title: "Refactor Workflow",
  purpose: "Make the implementation workflow cheaper and easier to run.",
  references: ["GH-1"],
  architectureOverview:
    "The orchestrator coordinates task execution, reviewer passes, and commit flow.",
  technicalDecisions:
    "- Prefer small deterministic helpers over ad hoc markdown scraping.\n- Keep the command as the single orchestrator.",
  backwardsCompatibility: "**Required:** Yes | **Rationale:** Existing commands depend on current behavior.",
  securityConsiderations: "Auth, middleware, and secret handling require careful review.",
  testingStrategy: "Unit test helpers and run the existing vitest suite.",
  qaRequired: false,
  tasks: [
    {
      title: "Build packet helpers",
      status: "completed",
      size: "Medium",
      purpose: "Add execution-packet helpers.",
      acceptance: "Helpers return deterministic minimal packets.",
      steps: ["Add helper library", "Add tests"],
      files: [".opencode/tools/lib/implementation-context.ts"],
      dependencies: [],
      contextTags: [],
      produces: [],
      consumes: [],
      refs: [],
      actualFiles: [],
      runtimeWarnings: [],
      startLine: 0,
      endLineExclusive: 0,
    },
    {
      title: "Update implementation command",
      status: "pending",
      size: "Medium",
      purpose: "Use packet helpers in the orchestrator contract.",
      acceptance: "Command docs describe minimal packets.",
      steps: ["Update command", "Update templates"],
      files: [".opencode/commands/pragmatic-implementation.md"],
      dependencies: ["Build packet helpers"],
      contextTags: [],
      produces: ["implementation-command-contract"],
      consumes: [],
      refs: [],
      actualFiles: [],
      runtimeWarnings: [],
      startLine: 0,
      endLineExclusive: 0,
    },
    {
      title: "Update public API contract",
      status: "pending",
      size: "Medium",
      purpose: "Expose a compact API packet for downstream tasks.",
      acceptance: "Downstream tasks receive only relevant interface context.",
      steps: ["Update API contract", "Document downstream expectations"],
      files: ["src/api/routes.ts"],
      dependencies: ["Update implementation command"],
      contextTags: ["interface"],
      produces: ["api-contract"],
      consumes: ["implementation-command-contract"],
      refs: [],
      actualFiles: [],
      runtimeWarnings: [],
      startLine: 0,
      endLineExclusive: 0,
    },
  ],
};

const completedTasks: CompletedTaskExecution[] = [
  {
    title: "Build packet helpers",
    filesModified: [".opencode/tools/lib/implementation-context.ts"],
    summary: "Added deterministic packet-selection helpers.",
    discoveries: [
      "Direct dependencies need prior task summaries, not full history.",
      "Middleware and auth work should carry security constraints into prompts.",
    ],
  },
  {
    title: "Older unrelated cleanup",
    filesModified: ["README.md"],
    summary: "Cleaned unrelated docs.",
    discoveries: ["Docs-only changes do not need architecture context."],
  },
];

describe("implementation-context helpers", () => {
  it("returns a minimal task packet for isolated small work", () => {
    const task = {
      ...basePlan.tasks[0],
      title: "Polish docs",
      purpose: "Update docs for the workflow.",
      acceptance: "Docs reflect the new packet names.",
      steps: ["Edit docs"],
      files: ["README.md"],
      dependencies: [],
      contextTags: [],
      produces: [],
      consumes: [],
    };

    const packet = selectTaskContext(basePlan, task, completedTasks);

    expect(packet.dependencyContext).toEqual([]);
    expect(packet.planContext.architectureOverview).toBeUndefined();
    expect(packet.planContext.technicalDecisions).toBeUndefined();
    expect(packet.otherCompletedSummary).toContain("Build packet helpers");
  });

  it("includes only direct dependency context and relevant discoveries", () => {
    const packet = selectTaskContext(basePlan, basePlan.tasks[1], completedTasks);

    expect(packet.dependencyContext).toHaveLength(1);
    expect(packet.dependencyContext[0].title).toBe("Build packet helpers");
    expect(packet.relevantDiscoveries).toContain(
      "Direct dependencies need prior task summaries, not full history.",
    );
    expect(packet.relevantDiscoveries).not.toContain(
      "Docs-only changes do not need architecture context.",
    );
  });

  it("pulls architecture and decision context for architecture-sensitive tasks", () => {
    const packet = selectTaskContext(basePlan, basePlan.tasks[2], completedTasks);

    expect(packet.flags.architectureSensitive).toBe(false);
    expect(packet.flags.interfaceSensitive).toBe(true);
    expect(packet.planContext.architectureOverview).toContain("orchestrator");
    expect(packet.planContext.technicalDecisions).toContain("Prefer small deterministic helpers");
    expect(packet.planContext.backwardsCompatibility).toBeUndefined();
  });

  it("lets explicit context tags force plan context for otherwise ordinary work", () => {
    const task = {
      ...basePlan.tasks[0],
      title: "Rotate auth secret docs",
      purpose: "Document a sensitive operational change.",
      acceptance: "Ops docs cover the secret rotation flow.",
      steps: ["Update runbook"],
      files: ["docs/runbooks/secrets.md"],
      dependencies: [],
      contextTags: ["security", "backwards_compat"],
      produces: [],
      consumes: [],
    };

    const packet = selectTaskContext(basePlan, task, completedTasks);

    expect(packet.flags.securitySensitive).toBe(true);
    expect(packet.flags.backwardsCompatSensitive).toBe(true);
    expect(packet.planContext.securityConsiderations).toContain("secret handling");
    expect(packet.planContext.backwardsCompatibility).toContain("Required:** Yes");
  });

  it("omits future-task context for ordinary review packets", () => {
    const task = {
      ...basePlan.tasks[0],
      title: "Polish docs",
      purpose: "Update docs for the workflow.",
      acceptance: "Docs reflect the new packet names.",
      steps: ["Edit docs"],
      files: ["README.md"],
      dependencies: [],
    };

    const packet = selectReviewContext(basePlan, task, ["README.md"], 1);

    expect(packet.relevantUpcomingTasks).toEqual([]);
    expect(packet.recheckIssues).toEqual([]);
    expect(packet.previousReviewSummary).toBeNull();
    expect(packet.planContext.architectureOverview).toBeUndefined();
  });

  it("includes only relevant downstream tasks for interface-changing review", () => {
    const packet = selectReviewContext(basePlan, basePlan.tasks[2], ["src/api/routes.ts"], 1);

    expect(packet.relevantUpcomingTasks).toEqual([]);

    const upstreamPacket = selectReviewContext(
      basePlan,
      basePlan.tasks[1],
      [".opencode/commands/pragmatic-implementation.md"],
      1,
    );

    expect(upstreamPacket.relevantUpcomingTasks).toEqual([
      {
        title: "Update public API contract",
        purpose: "Expose a compact API packet for downstream tasks.",
      },
    ]);
  });

  it("uses produces and consumes metadata before keyword matching for downstream context", () => {
    const metadataPlan: ParsedPlan = {
      ...basePlan,
      tasks: [
        {
          ...basePlan.tasks[0],
          title: "Define event schema",
          purpose: "Add a new event contract.",
          files: ["src/events/schema.ts"],
          dependencies: [],
          contextTags: ["interface"],
          produces: ["event-schema-v2"],
          consumes: [],
        },
        {
          ...basePlan.tasks[1],
          title: "Wire event publisher",
          purpose: "Publish the new schema.",
          files: ["src/events/publisher.ts"],
          dependencies: [],
          contextTags: ["integration"],
          produces: [],
          consumes: ["event-schema-v2"],
        },
      ],
    };

    const packet = selectReviewContext(
      metadataPlan,
      metadataPlan.tasks[0],
      ["src/events/schema.ts"],
      1,
    );

    expect(packet.relevantUpcomingTasks).toEqual([
      {
        title: "Wire event publisher",
        purpose: "Publish the new schema.",
      },
    ]);
  });

  it("carries explicit re-review issues into later review passes", () => {
    const packet = selectReviewContext(
      basePlan,
      basePlan.tasks[1],
      [".opencode/commands/pragmatic-implementation.md"],
      2,
      {
        summary: "Verify the context trim and dependency handling fixes.",
        issues: [
          {
            severity: "medium",
            title: "Context still too broad",
            summary: "The packet included unrelated prior history.",
            recommendation: "Limit context to direct dependencies.",
          },
        ],
      },
    );

    expect(packet.reviewPass).toBe(2);
    expect(packet.previousReviewSummary).toContain("context trim");
    expect(packet.recheckIssues).toEqual([
      {
        severity: "medium",
        title: "Context still too broad",
        summary: "The packet included unrelated prior history.",
        recommendation: "Limit context to direct dependencies.",
      },
    ]);
  });

  it("returns compact retry issues without carrying full reviewer prose", () => {
    const packet = buildRetryIssuePacket({
      summary: "Two issues remain",
      highest_severity: "high",
      issues: [
        {
          severity: "high",
          title: "Too much context",
          summary: "Prompt still carries full plan text.",
          recommendation: "Trim to the packet payload.",
        },
      ],
    });

    expect(packet.kind).toBe("retry_packet");
    expect(packet.issues).toHaveLength(1);
    expect("rawReviewOutput" in packet).toBe(false);
  });

  it("builds a richer but still compressed holistic context", () => {
    const packet = buildHolisticContext(basePlan, completedTasks);

    expect(packet.completedTaskSummaries).toHaveLength(2);
    expect(packet.accumulatedDiscoveries).toContain(
      "Direct dependencies need prior task summaries, not full history.",
    );
    expect(packet.planContext.testingStrategy).toContain("vitest");
  });

  it("produces smaller packets than a legacy full-context payload", () => {
    const minimalPacket = selectTaskContext(basePlan, basePlan.tasks[1], completedTasks);
    const legacyPayload = {
      taskName: basePlan.tasks[1].title,
      purpose: basePlan.tasks[1].purpose,
      architecture: basePlan.architectureOverview,
      decisions: basePlan.technicalDecisions,
      backwardsCompatibility: basePlan.backwardsCompatibility,
      securityConsiderations: basePlan.securityConsiderations,
      completedTasks,
      allTasks: basePlan.tasks.map((task) => ({
        title: task.title,
        purpose: task.purpose,
        steps: task.steps,
        files: task.files,
      })),
      allDiscoveries: completedTasks.flatMap((task) => task.discoveries),
    };

    expect(estimatePacketSize(minimalPacket)).toBeLessThan(estimatePacketSize(legacyPayload));
  });
});
