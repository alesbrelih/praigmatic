# False Positive Patterns

Common patterns that lead to overstated or false findings. The skeptic should
check for these before accepting any claim at face value.

## Category 1: Not a Vulnerability

### Functionality by Design
- Search fields returning results = not injection, just search
- Public APIs returning data = not information disclosure if data is public
- Admin functions accessible to admins = not broken access control
- Login forms accepting valid credentials = not authentication bypass
- Password reset working as designed = not account takeover

### Browser-Non-Renderable Injection
- XSS in `<meta>` tags that browsers do not render as JS
- XSS in `<title>` tags (content is text, not HTML)
- XSS in `<noscript>` tags (only renders when JS is disabled)
- XSS in HTML attributes that don't execute JS (e.g., `<img src=xss>`)
- XSS in contexts where CSP blocks execution (check CSP headers first)
- XSS in JSON API responses (not rendered as HTML by the browser)

### Non-Exploitable Conditions
- Self-XSS requiring user to paste payload into their own console
- XSS in authenticated-only pages with no other users affected
- CSRF on actions that only affect the attacking user
- Open redirect to same domain or subdomain
- Error messages containing no sensitive information (generic stack traces)

## Category 2: Severity Overstatement

### CVSS Inflation
- Scoring XSS as C:H when only C:L is demonstrated (no data exfiltration proof)
- Scoring information disclosure as I:H when data is low-sensitivity
- Ignoring authentication requirements in Attack Complexity
- Claiming AV:N for vulnerabilities requiring local network access
- Using S:C for vulnerabilities that don't cross trust boundaries

### Impact Overstatement
- "Full system compromise" from a low-privilege SQL injection
- "Session hijacking" from reflected XSS without demonstrating cookie theft
- "Data exfiltration" from error-based info disclosure without proof of data access
- "Denial of service" from a condition that only slows responses

### Scope Overstatement
- Claiming one endpoint vulnerability affects the entire application
- Listing entire subnets as affected when only one host is vulnerable
- Claiming "all users" affected when only one role is impacted

## Category 3: Insufficient Evidence

### Missing Proof of Exploit
- Blind SQL injection claimed without any data extraction (even partial)
- SSRF claimed without showing internal resource was accessed
- Race condition claimed without demonstrating the timing window
- Deserialization claimed without demonstrating code execution or data manipulation

### Missing Context
- Finding reported without authentication context (anonymous vs authenticated)
- Finding reported without describing the user role and permissions
- Finding reported without the actual HTTP request/response
- Finding reported without the application's intended behavior

## Category 4: Environmental Misjudgment

### Business Context Ignored
- Flagging a public directory listing on a public file server as information disclosure
- Flagging verbose errors on a staging environment (not production)
- Flagging missing headers on an internal-only API
- Flagging default credentials on a device where they are documented and intended

### CVSS Environmental Metrics Ignored
- Not adjusting for public vs internal application
- Not considering the user base (1 admin vs 10000 users)
- Not factoring in existing compensating controls (WAF, monitoring, etc.)
- Not considering the data classification of affected systems

## Pattern Matching Guide

When evaluating a finding, run through these checks:

1. **Is this the intended behavior?** → Check application purpose, user roles, documentation
2. **Does the exploit actually work in a browser?** → Playwright test required
3. **Is the claimed impact demonstrated or theoretical?** → Evidence inventory
4. **Does the CVSS vector match what was actually shown?** → CVSS calibration
5. **Does business context reduce the risk?** → Environmental assessment
6. **Is enough evidence provided to reproduce?** → Replication check
