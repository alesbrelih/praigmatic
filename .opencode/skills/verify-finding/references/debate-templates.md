# Debate Templates

Structured output templates for each role in the verification workflow. These
ensure consistent, parseable output that the orchestrator can process.

## Template 1: Skeptic Challenge (Round 1)

```markdown
🔴 **Skeptic Challenge — Round 1**

**Finding:** [title]

### Replication Verification

| Step | Expected (from finding) | Actual | Result |
|------|-------------------------|--------|--------|
| 1 | [what the finding claims happens] | [what actually happened] | Pass / Fail / Deviated |
| 2 | [next step claim] | [actual result] | Pass / Fail / Deviated |

**Reproduction verdict:** Fully Reproduced / Partially Reproduced / Not Reproduced / Cannot Reproduce

[If Not/Cannot Reproduced: This is the top-priority Critical challenge.]

### Challenges

| # | Challenge | Severity | Category | Evidence Needed | Empirical Test |
|---|-----------|----------|----------|-----------------|----------------|
| 1 | [challenge description] | Critical/High/Medium | Technical/Business/Empirical | [what would resolve this] | [Playwright test or N/A] |

### Empirical Tests Executed

| Test | Target | Result | Details |
|------|--------|--------|---------|
| [test description] | [URL/endpoint] | PASSED/FAILED/INCONCLUSIVE | [what happened] |

### Business Context Assessment

- **"By design" argument:** [Is this functionality intended? Assessment]
- **CVSS concern:** [Specific metric concern, if any]
- **Business impact reality:** [Does the business context reduce the claimed impact?]

### Preliminary Verdict

- **Recommendation:** [Confirmed/Downgraded/False Positive/Insufficient Evidence]
- **Adjusted CVSS (if Downgraded):** [vector] — [rationale for each changed metric]
- **Key weaknesses:** [List of unresolved challenges]
```

## Template 2: Presenter Defense (Round 1)

```markdown
🟢 **Presenter Defense — Round 1**

**Finding:** [title]

### Defense Against Challenges

| # | Challenge | Response | Status |
|---|-----------|----------|--------|
| 1 | [challenge] | [evidence or reasoning] | Defended/Conceded/Partially Defended |

### Concessions

- [What the presenter concedes and why]
- [Impact of each concession on the finding]

### Strengthened Claims

- [New evidence gathered to support the finding]
- [How this addresses skeptic challenges]

### Evidence Added

- [New URLs, payloads, screenshots, or test results]

### Remaining Weaknesses

- [What couldn't be defended]
- [What needs operator input]
```

## Template 3: Skeptic Challenge (Round 2)

```markdown
🔴 **Skeptic Challenge — Round 2**

**Finding:** [title]

### Replication Re-test

Re-test using presenter's corrected/clarified replication steps from Round 1.

| Step | Original Claim | Presenter's Correction | Actual | Result |
|------|----------------|------------------------|--------|--------|
| 1 | [original step] | [presenter's corrected step] | [what happened] | Pass / Fail / Deviated |

**Reproduction verdict (Round 2):** Fully Reproduced / Partially Reproduced / Not Reproduced / Cannot Reproduce

[Compare to Round 1 verdict: has the reproduction improved?]

### Remaining Challenges

Focus on points not conceded by presenter in Round 1.

| # | Challenge | Severity | New Evidence | Empirical Test |
|---|-----------|----------|--------------|----------------|
| 1 | [remaining challenge] | Critical/High/Medium | [since round 1] | [test or N/A] |

### Additional Empirical Tests

| Test | Target | Result | Details |
|------|--------|--------|---------|
| [test description] | [URL/endpoint] | PASSED/FAILED/INCONCLUSIVE | [what happened] |

### Conceded by Presenter (from Round 1)

- [List of points the presenter conceded]

### Updated Verdict

- **Recommendation:** [Confirmed/Downgraded/False Positive/Insufficient Evidence]
- **Adjusted CVSS (if Downgraded):** [vector] — [rationale]
- **Unresolved points:** [List]
```

## Template 4: Presenter Response (Round 2)

```markdown
🟢 **Presenter Response — Round 2**

**Finding:** [title]

### Final Defense

| # | Challenge | Response | Status |
|---|-----------|----------|--------|
| 1 | [remaining challenge] | [evidence or reasoning] | Defended/Conceded |

### Final Concessions

- [Points conceded in this round]

### Final State

- **Defended points:** [List of points successfully defended]
- **Conceded points:** [List of points conceded across both rounds]
- **Needs operator input:** [Questions only the operator can answer]
```

## Template 5: Arbiter Verdict

```markdown
⚖️ **Arbiter Verdict**

**Finding:** [title]

### Debate Summary

- **Round 1 — Skeptic:** [summary of challenges]
- **Round 1 — Presenter:** [summary of defense, concessions]
- **Round 2 — Skeptic:** [summary of remaining challenges]
- **Round 2 — Presenter:** [final defense, concessions]
- **Operator input (if any):** [summary]

### Key Evidence

- **Empirical test results:** [summary of Playwright tests]
- **Conceded points:** [what the presenter conceded]
- **Defended points:** [what the presenter successfully defended]
- **Unresolved questions:** [what remains unclear]

### Verdict

**Verdict:** [Confirmed / Downgraded / False Positive / Insufficient Evidence]

**Rationale:** [Synthesis of the debate, key factors that determined the verdict]

### CVSS Assessment

**Original CVSS:** [vector]
**Final CVSS:** [vector] — [rationale for each changed metric]

### Recommended SysReptor Patches

| Field | Original | Proposed | Reason |
|-------|----------|----------|--------|
| [field] | [original value] | [new value] | [why] |

(Only include fields that need changes. Omit unchanged fields.)
```

## Template 6: Operator Checkpoint Prompt

Used by the orchestrator to prompt the operator for input.

```markdown
## Operator Checkpoint

The debate on **[finding title]** has reached a checkpoint.

### Current State
- **Round:** [1/2]
- **Contested points:** [list]
- **Conceded points:** [list]
- **Skeptic recommendation:** [verdict]
- **Presenter position:** [verdict]

### Your Input Needed

[Specific questions only the operator can answer]

1. [Question about business context]
2. [Question about intended behavior]
3. [Question about risk acceptance]

**Options:**
- Provide context and continue debate
- Accept skeptic's recommendation
- Accept presenter's position
- Override with your own verdict
```
