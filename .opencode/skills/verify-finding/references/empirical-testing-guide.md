# Empirical Testing Guide

Instructions for using Playwright MCP to empirically verify web vulnerability
claims. The skeptic MUST test any finding that can be browser-validated before
accepting theoretical arguments.

## Replication Step Re-execution (MANDATORY FIRST STEP)

Before any ad-hoc vulnerability-specific testing, the skeptic MUST attempt to
reproduce the finding by following its own Steps to Reproduce verbatim. This is
the most fundamental empirical test — if the documented steps don't produce the
claimed result, the finding fails its own evidence standard.

### Procedure

1. **Read the Steps to Reproduce** from the finding document
2. **Execute each step in Playwright** exactly as written — same URL, same payload,
   same parameter, same authentication context
3. **Record the actual outcome** at every step, not what was expected
4. **Classify the reproduction result:**
   - **Fully Reproduced** — Every step produces the claimed result
   - **Partially Reproduced** — Core behavior works but deviates from the description
     (e.g., wrong payload variant needed, extra prerequisite, different error message,
     slightly different URL)
   - **Not Reproduced** — Steps fail to produce the claimed vulnerability
   - **Cannot Reproduce** — Steps are incomplete: missing URLs, missing credentials,
     undefined parameters, or references to resources that don't exist

### Handling Reproduction Failures

- **Not Reproduced** → Critical challenge. The finding's own evidence doesn't support
  its claim. The skeptic should flag this as the top-priority challenge before any
  theoretical argument.
- **Cannot Reproduce** → High challenge. The replication steps are insufficient for
  independent verification. This maps to "Insufficient Evidence" verdict territory.
- **Partially Reproduced** → Document every deviation. Each deviation is a potential
  High or Medium challenge (severity depends on whether the core claim holds).

### Round 2 Re-execution

If the presenter provides corrected or clarified replication steps during the
debate, the skeptic MUST re-test those steps in Round 2. The Round 2 replication
table should compare:
- Original steps vs. presenter's corrected steps
- Whether the corrected steps now reproduce the finding
- Any remaining deviations

### Reporting

Use the `### Replication Verification` section in Template 1 (Round 1) and
Template 3 (Round 2) from the debate-templates reference. Each step gets a row
in the step table, plus an overall reproduction verdict.

## General Testing Principles

1. **Test the actual claim** — If the finding says "XSS executes alert(1)", test
   whether alert(1) actually fires, not whether the payload appears in the source.
2. **Test in a real browser** — Use Playwright, not theoretical analysis. Source
   code inspection is not evidence of execution.
3. **Document the test** — Record the URL, payload, navigation steps, and actual
   result. Screenshots help.
4. **Test the full chain** — If the exploit requires multiple steps, test all of
   them, not just the injection point.
5. **Check CSP and other mitigations** — Even if the payload injects, CSP may
   block execution. Check headers before concluding XSS is exploitable.

## XSS Testing

### Reflected XSS
1. Navigate to the vulnerable URL with the XSS payload as a parameter
2. Wait for the page to load and check for:
   - Browser dialog (alert) — use `playwright_browser_wait_for` for "text" or check for dialog
   - DOM mutations — use `playwright_browser_evaluate` to check if expected DOM changes occurred
   - Console errors — use `playwright_browser_console_messages` to check for JS execution evidence
3. If no visible execution, check the page source:
   - Is the payload in an execution context (`<script>`, event handler)?
   - Or is it in a non-execution context (`<meta>`, `<title>`, attribute value)?
4. If CSP is present, check if it blocks inline scripts or the specific source

### Stored XSS
1. Inject the payload through the input vector (form submission, API call)
2. Navigate to the page where the stored payload renders
3. Same checks as reflected XSS above
4. Also check if other users' sessions would see the payload (role-based contexts)

### DOM-based XSS
1. Navigate to the URL with the payload in the appropriate source (URL fragment, postMessage)
2. Use `playwright_browser_evaluate` to check DOM sinks (innerHTML, document.write, eval)
3. Verify the sink actually processes the malicious input

## Open Redirect Testing

1. Navigate to the redirect URL with an external destination
2. After navigation, check the final URL:
   - Use `playwright_browser_evaluate` to get `window.location.href`
   - Verify it lands on the external domain, not just the internal path
3. Check if the redirect goes through an intermediate page (user awareness)
4. Check if the redirect preserves authentication cookies (session riding risk)

## CSS Injection Testing

1. Navigate to the page with the CSS payload
2. Use `playwright_browser_evaluate` to check:
   - Were the styles actually applied? (`getComputedStyle`)
   - Can the CSS exfiltrate data? (attribute selectors, font-face loading)
3. Take a screenshot to verify visual impact

## Error-Based Information Disclosure Testing

1. Trigger the error condition (malformed input, invalid parameters)
2. Capture the response:
   - Use `playwright_browser_snapshot` to see the rendered page
   - Use `playwright_browser_evaluate` to extract text content
3. Check if the error contains:
   - Stack traces with file paths
   - Database query details
   - Internal IP addresses or hostnames
   - Application secrets or configuration values
4. Compare against generic error messages — is this actually disclosing sensitive info?

## File Inclusion Testing

1. Provide the inclusion path in the input
2. Navigate to the page that should render the included file
3. Check for:
   - File content appearing in the response
   - Error messages confirming file existence
   - Execution of included code (PHP, SSI, etc.)
4. Use `playwright_browser_evaluate` to check if included content is rendered

## Testing Checklist

For each browser-testable finding, the skeptic should answer:

- [ ] Did I navigate to the actual vulnerable URL with the payload?
- [ ] Did I verify the exploit actually executes (not just injects)?
- [ ] Did I check for browser security features that may block exploitation (CSP, sandbox, CORS)?
- [ ] Did I test with the correct authentication context (anonymous, user, admin)?
- [ ] Did I document the actual result (not the expected result)?
- [ ] Did I take a screenshot as evidence?

## When Tests Fail

If the Playwright test shows the vulnerability does NOT work as claimed:

1. **Report the test result** — "Playwright test: XSS payload does not execute.
   Payload appears in `<meta>` tag which browsers do not render as JS."
2. **Do not assume it works anyway** — The no-assumption policy means the finding
   is not confirmed until empirical proof exists.
3. **Consider alternative contexts** — Might it work in a different browser? With
   different headers? Document these as untested hypotheses, not confirmed facts.
4. **Propose the correct verdict** — If the core claim fails empirically, the
   finding is likely a false positive or needs downgrade.
