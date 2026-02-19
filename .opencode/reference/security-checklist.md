# Security Checklist

Security review requirements for all code changes.

## Input Validation

- [ ] All user input validated and sanitized before use
- [ ] SQL injection prevention — parameterized queries or ORM, never string concatenation
- [ ] XSS protection — user content escaped/sanitized before rendering
- [ ] Command injection prevention — no user input in shell commands, use libraries
- [ ] Path traversal prevention — validate file paths, reject `../` sequences
- [ ] Content-Type validation — verify uploaded files match expected types
- [ ] Input length limits — enforce maximum lengths on all string inputs
- [ ] Reject unexpected fields — allowlist accepted parameters, don't just blocklist

## Authentication & Authorization

- [ ] Authentication required on all non-public endpoints
- [ ] Authorization checked before every operation — verify user has permission for the specific resource
- [ ] Passwords hashed with bcrypt/argon2 (never MD5/SHA for passwords)
- [ ] JWT tokens: short expiry, secure signing algorithm (RS256/ES256), validate all claims
- [ ] Session tokens: regenerate after login, invalidate on logout
- [ ] CSRF protection on state-changing endpoints (POST/PUT/DELETE)
- [ ] Rate limiting on authentication endpoints — prevent brute force

## Secrets & Credentials

- [ ] No secrets in source code — use environment variables or secret managers
- [ ] No secrets in logs — mask tokens, passwords, API keys before logging
- [ ] `.env` files in `.gitignore` — never committed
- [ ] API keys scoped to minimum required permissions
- [ ] Database credentials use least-privilege accounts

## Error Handling & Information Disclosure

- [ ] Error messages don't expose internals — no stack traces, SQL errors, or file paths to users
- [ ] Generic error messages for auth failures — "invalid credentials" not "user not found"
- [ ] Sensitive data not in URL parameters — use POST body or headers
- [ ] Debug mode disabled in production
- [ ] Secure HTTP headers set — HSTS, X-Content-Type-Options, X-Frame-Options

## Data Protection

- [ ] PII encrypted at rest — use application-level or database-level encryption
- [ ] TLS/HTTPS for all data in transit
- [ ] Sensitive data has retention policies — don't store what you don't need
- [ ] Database backups encrypted
- [ ] Audit logging for sensitive operations — who did what, when

## Common Vulnerabilities Quick Reference

| Vulnerability | Prevention | Example |
|--------------|------------|---------|
| SQL Injection | Parameterized queries | `db.query("SELECT * FROM users WHERE id = $1", [id])` |
| XSS | Escape output, CSP headers | Use framework auto-escaping, set `Content-Security-Policy` |
| CSRF | Token validation | Include CSRF token in forms, validate on server |
| Auth Bypass | Check auth on every handler | Middleware that runs before route handlers |
| IDOR | Verify resource ownership | `WHERE id = $1 AND owner_id = $2` |
| Mass Assignment | Allowlist fields | Pick specific fields, don't spread request body |
| Open Redirect | Validate redirect URLs | Only allow relative paths or whitelisted domains |
