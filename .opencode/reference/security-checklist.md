# Security Checklist

Security review requirements for all code changes.

## Input Validation

- [ ] Input validation and sanitization present
- [ ] SQL injection prevention (parameterized queries or ORM)
- [ ] XSS protection (user content escaped)
- [ ] Command injection prevention

## Authentication & Authorization

- [ ] Authentication checks in place
- [ ] Authorization verified before operations
- [ ] Sensitive data handled securely
- [ ] CSRF protection where applicable

## Error Handling & Data Protection

- [ ] Error messages don't leak information
- [ ] Sensitive data not logged
- [ ] Rate limiting on sensitive endpoints
- [ ] Secure defaults used

## Common Vulnerabilities

| Vulnerability | Prevention |
|--------------|------------|
| SQL Injection | Parameterized queries, ORM |
| XSS | Escape/sanitize user content |
| CSRF | Token validation |
| Auth Bypass | Check auth on all handlers |
| Info Leakage | Generic error messages |
