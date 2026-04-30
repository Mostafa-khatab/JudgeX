# 🔐 Security Test Checklist - JudgeX

## Pre-Deployment Security Verification

Complete this checklist before deploying to production.

---

## 1. Authentication & Authorization Tests

### JWT & Token Security
- [ ] **Token Generation**: Verify crypto.randomBytes(32) is used (not Math.random())
  - [ ] Verify token entropy: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - [ ] Tokens are 64 character hexadecimal strings
  - [ ] Each generated token is unique

- [ ] **Token Expiry**: Verify alignment between JWT expiry and cookie TTL
  - [ ] JWT_EXPIRY matches COOKIE_MAX_AGE
  - [ ] Default: 30 days for both
  - [ ] Test: Tokens expire after 30 days

- [ ] **Cookie Security**: Verify flags are set correctly
  - [ ] `httpOnly: true` (prevents JS access)
  - [ ] `secure: true` in production (HTTPS only)
  - [ ] `sameSite: 'strict'` in production (CSRF protection)
  - [ ] Test in browser DevTools: Application > Cookies
  - [ ] Verify secure flag is set (⚠️ symbol shown)

### Session & Authentication Flow
- [ ] Email verification is enforced before login
  - [ ] Unverified users cannot access protected routes
  - [ ] Test: Login without verification → Blocked
  - [ ] Test: Verify email → Can login

- [ ] Password verification is working
  - [ ] Wrong password → Login rejected
  - [ ] Correct password → Login successful
  - [ ] Bcrypt hashing is used (not plaintext)

- [ ] Logout clears sessions properly
  - [ ] Cookies are cleared on logout
  - [ ] Tokens cannot be reused after logout
  - [ ] Socket connections are terminated

---

## 2. Input Validation & Injection Prevention

### Form Validation
- [ ] Signup validation
  - [ ] Email: Valid format required (@, domain)
    - Test: `test` → Rejected
    - Test: `test@` → Rejected
    - Test: `test@example.com` → Accepted
  
  - [ ] Password: Minimum 8 chars, uppercase, lowercase, number, special char
    - Test: `password` → Rejected
    - Test: `Password123` → Rejected (no special char)
    - Test: `Password123!` → Accepted

  - [ ] Name: Minimum 2 characters
    - Test: `A` → Rejected
    - Test: `AB` → Accepted

- [ ] Login validation
  - [ ] Email required
  - [ ] Password required
  - [ ] Email format validation

- [ ] Submission validation
  - [ ] Problem ID required
  - [ ] Code source required (not empty)
  - [ ] Language must be from allowed list (javascript, python, cpp, etc.)
  - [ ] No file size bypass (check SIZE validation)

### SQL/NoSQL Injection Prevention
- [ ] **NoSQL Injection Tests**:
  - [ ] Test with object payload:
    ```json
    {
      "email": { "$ne": null },
      "password": { "$ne": null }
    }
    ```
    Expected: Rejected with 400 error

  - [ ] Test with MongoDB operators:
    ```json
    {
      "email": { "$gt": "" },
      "password": { "$gt": "" }
    }
    ```
    Expected: Rejected

- [ ] **XSS Prevention**:
  - [ ] Test with script tags:
    ```
    <script>alert('xss')</script>
    ```
    Expected: Rejected or sanitized

  - [ ] Test with event handlers:
    ```
    "><svg onload=alert('xss')>
    ```
    Expected: Rejected

- [ ] All Zod schemas are in place
  - [ ] `SignupSchema`
  - [ ] `LoginSchema`
  - [ ] `SubmitCodeSchema`
  - [ ] `CreateInterviewSchema`
  - [ ] `JoinInterviewSchema`

---

## 3. Rate Limiting & DDoS Protection

### Login Rate Limiting
- [ ] Max 5 login attempts per 15 minutes
  - [ ] Attempt 1-5: Allowed
  - [ ] Attempt 6: Returns 429 (Too Many Requests)
  - [ ] After 15 minutes: Can attempt again

- [ ] Test verification:
  ```bash
  for i in {1..6}; do
    curl -X POST http://localhost:8080/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"test@test.com","password":"wrong"}'
  done
  ```
  Expected: 5 successful requests, 6th returns 429

### Signup Rate Limiting
- [ ] Max 3 signup attempts per 15 minutes
  - [ ] Test: 3 signups allowed
  - [ ] Test: 4th signup returns 429

### Email Verification Rate Limiting
- [ ] Max 10 verification attempts per 15 minutes
  - [ ] Test: 10 attempts allowed
  - [ ] Test: 11th attempt returns 429

### Password Reset Rate Limiting
- [ ] Max 3 password reset attempts per 15 minutes
  - [ ] Test: 3 resets allowed
  - [ ] Test: 4th reset returns 429

### API Rate Limiting
- [ ] General API: 100 requests per 15 minutes
  - [ ] Monitor X-RateLimit headers
  - [ ] Verify reset after 15 minutes

---

## 4. CSRF Protection

### Interview Join CSRF Fix
- [ ] Interview join uses POST (not GET)
  - [ ] Test: GET /interview/join → Rejected (405 or 404)
  - [ ] Test: POST /interview/join → Accepted
  - [ ] Parameters in request body (not URL query string)

- [ ] Form-based operations use POST
  - [ ] Contest join: POST
  - [ ] Submission create: POST
  - [ ] Interview end: POST

### SameSite Cookie
- [ ] SameSite=Strict in production
  - [ ] Chrome DevTools: Check cookie flags
  - [ ] Verify cross-site requests blocked

---

## 5. Race Condition Prevention

### Interview Join Transaction
- [ ] Concurrent joins are prevented
  - [ ] Simulate 2 candidates joining simultaneously
  - [ ] Expected: Only 1 succeeds, other fails
  - [ ] Check MongoDB transaction logs

- [ ] Test concurrent submissions
  - [ ] Submit same code twice within 1 second
  - [ ] Expected: 2nd rejected (duplicate prevention)
  - [ ] HTTP Status: 429

---

## 6. Error Handling & Information Disclosure

### Stack Trace Prevention
- [ ] No stack traces in production errors
  - [ ] Trigger error (e.g., invalid ID)
  - [ ] Response should NOT contain stack trace
  - [ ] Example good response:
    ```json
    {
      "error": "Invalid submission ID",
      "statusCode": 400
    }
    ```

- [ ] No sensitive database paths exposed
  - [ ] MongoDB connection strings not visible
  - [ ] API keys not in errors

### Error Response Format
- [ ] All errors use unified format
  - [ ] Contains `error` field
  - [ ] Contains `statusCode` field
  - [ ] No extra debug information

### Proper HTTP Status Codes
- [ ] 400: Bad Request (validation errors)
- [ ] 401: Unauthorized (no auth token)
- [ ] 403: Forbidden (insufficient permissions)
- [ ] 404: Not Found (resource doesn't exist)
- [ ] 429: Too Many Requests (rate limit)
- [ ] 500: Internal Server Error (never in production)

---

## 7. Authorization & Permission Checks

### Admin-Only Operations
- [ ] Only admins can delete submissions
  - [ ] Non-admin user: Rejected (403)
  - [ ] Admin user: Allowed

- [ ] Only admins can modify contests
  - [ ] Regular user: Rejected
  - [ ] Admin user: Allowed

- [ ] Only interview creator/instructor can modify interview
  - [ ] Other users: Rejected
  - [ ] Instructor: Allowed

### User-Specific Data Access
- [ ] Users can only see their own submissions (unless admin)
  - [ ] Test: Access other user's submission → Rejected
  - [ ] Test: Access own submission → Allowed

- [ ] Users can only modify their own profile
  - [ ] Test: Modify other user's profile → Rejected
  - [ ] Test: Modify own profile → Allowed

---

## 8. Database Security

### Database Indexes
- [ ] Verify indexes are created:
  ```javascript
  // In MongoDB shell or app startup
  db.users.getIndexes()
  db.interviews.getIndexes()
  db.submissions.getIndexes()
  ```
  
  Expected User indexes:
  - [ ] email (1)
  - [ ] name (1)
  - [ ] permission, totalScore (-1)
  - [ ] createdAt (-1)
  - [ ] isVerified (1)

  Expected Interview indexes:
  - [ ] instructor, createdAt (-1)
  - [ ] inviteToken (1)
  - [ ] status, createdAt (-1)
  - [ ] createdAt (-1)
  - [ ] candidate.email (1)

### Query Performance
- [ ] Submission list loads in < 100ms (with 1000+ records)
  - [ ] Test: `curl http://localhost:8080/submission?limit=20`
  - [ ] Check response time in Network tab
  - [ ] Before: 3-5 seconds
  - [ ] After: 50-100ms

- [ ] No N+1 queries detected
  - [ ] Enable MongoDB profiling
  - [ ] Check query logs
  - [ ] Expected: 3 queries for submission list
  - [ ] Before: 1000+ queries

---

## 9. Socket.IO Security

### Authentication
- [ ] Connection without token → Rejected
  - [ ] Test: Connect without auth token
  - [ ] Expected: `connect_error` event
  - [ ] Status code: 401 or 403

- [ ] Connection with invalid token → Rejected
  - [ ] Test: Connect with `auth: { token: 'invalid' }`
  - [ ] Expected: Connection refused

- [ ] Connection with valid token → Accepted
  - [ ] Test: Connect with valid JWT
  - [ ] Expected: Connection success

### Access Control
- [ ] Only participants can access interview room
  - [ ] Test: Non-participant tries to join interview
  - [ ] Expected: Rejected

- [ ] Users can only emit events for their rooms
  - [ ] Test: Emit event for other user's room
  - [ ] Expected: Rejected

### Data Integrity
- [ ] All Socket.IO events are validated
  - [ ] Payload schema checked
  - [ ] Data type validation
  - [ ] No arbitrary data accepted

---

## 10. Cryptography & Secrets

### Secret Management
- [ ] Secrets NOT in source code
  - [ ] Check: `grep -r "password" src/`
  - [ ] Check: `grep -r "secret" src/` (except config constants)
  - [ ] No hardcoded API keys

- [ ] .env file in .gitignore
  - [ ] Verify: `cat .gitignore | grep .env`
  - [ ] Result: `.env` should be listed

- [ ] Strong secret keys used
  - [ ] JWT_SECRET: minimum 32 characters
  - [ ] SESSION_SECRET: minimum 32 characters
  - [ ] All secrets are random (use: `openssl rand -base64 32`)

### Password Hashing
- [ ] Passwords hashed with Bcrypt
  - [ ] Check source: `grep -r "bcrypt" src/utils/auth.js`
  - [ ] Salt rounds: 10-12
  - [ ] Never log passwords

---

## 11. Audit Logging

### Sensitive Operations Logged
- [ ] [ ] User signup logged
  - [ ] Fields: timestamp, email, userId, IP
  - [ ] No passwords logged

- [ ] User login logged
  - [ ] Fields: timestamp, email, IP, success/failure

- [ ] Password reset logged
  - [ ] Fields: timestamp, userId, IP

- [ ] Interview creation logged
  - [ ] Fields: timestamp, instructor, candidate email

- [ ] Submission created logged
  - [ ] Fields: timestamp, userId, problemId

### Audit Log Retention
- [ ] Logs stored in database
  - [ ] Collection: `auditlogs`
  - [ ] TTL index: 90 days (configurable)
  - [ ] Immutable (not modifiable)

---

## 12. Environment-Specific Security

### Development Environment
- [ ] NODE_ENV=development
- [ ] `sameSite: 'lax'` (for local testing)
- [ ] `secure: false` (for HTTP localhost)
- [ ] Debug logs enabled
- [ ] HTTPS not required

### Production Environment
- [ ] NODE_ENV=production
- [ ] `sameSite: 'strict'` ✅
- [ ] `secure: true` (HTTPS only) ✅
- [ ] Debug logs disabled ✅
- [ ] HTTPS enforced ✅
- [ ] All secrets in .env ✅
- [ ] Email verification required ✅
- [ ] Rate limiting active ✅

### Verification Commands
```bash
# Verify environment
echo $NODE_ENV  # Should output: production

# Verify HTTPS
curl -I https://your-domain.com  # Should work

# Verify secrets not in code
grep -r "secret" src/ --include="*.js" | grep -v "config" | grep -v "// SECRET"

# Verify .env not tracked
git status | grep .env  # Should show nothing
```

---

## 13. HTTPS & SSL/TLS

### Certificate Verification
- [ ] SSL/TLS certificate valid
  - [ ] Test: `openssl s_client -connect your-domain.com:443`
  - [ ] Check: Certificate should not be expired
  - [ ] Check: Common Name matches domain

- [ ] HSTS header present
  - [ ] Test: `curl -I https://your-domain.com | grep Strict`
  - [ ] Expected: `Strict-Transport-Security`

- [ ] Mixed content prevented
  - [ ] All resources loaded over HTTPS
  - [ ] Check browser console: no warnings

---

## 14. API Security

### CORS Configuration
- [ ] Only allowed origins
  - [ ] CLIENT_URL set correctly
  - [ ] No wildcard (*) in production
  - [ ] Test: Cross-origin request from unauthorized domain → Blocked

- [ ] Credentials properly handled
  - [ ] `credentials: true` set
  - [ ] Cookies sent with requests

### Response Headers
- [ ] Security headers present:
  - [ ] X-Frame-Options: SAMEORIGIN
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Referrer-Policy: strict-origin-when-cross-origin

---

## 15. Testing Results

### Test Execution
- [ ] All integration tests pass
  ```bash
  npm test tests/integration.test.js
  ```

- [ ] No security warnings from audit
  ```bash
  npm audit
  ```

- [ ] Load testing passes
  - [ ] 100 concurrent requests: < 5s response time
  - [ ] No memory leaks
  - [ ] Database connections stable

### Performance Benchmarks
- [ ] Login: < 500ms
- [ ] Signup: < 500ms
- [ ] Submission list: < 100ms
- [ ] User ranking: < 500ms (with cache: < 100ms)

---

## 16. Deployment Checklist

- [ ] Database migrations complete
- [ ] Indexes created in production DB
- [ ] .env.example copied to .env with production values
- [ ] All dependencies installed: `npm install`
- [ ] Build successful: `npm run build`
- [ ] No console.log or debug code in production
- [ ] Error monitoring configured (Sentry, etc.)
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Team notified of deployment

---

## 17. Post-Deployment Verification

### 24-Hour Monitoring
- [ ] [ ] Monitor error logs for anomalies
- [ ] No unexpected 500 errors
- [ ] Rate limiting working as expected
- [ ] Database performance stable
- [ ] No security alerts
- [ ] Authentication/authorization working

### Weekly Reviews
- [ ] Audit log review
- [ ] Performance metrics review
- [ ] Security alerts check
- [ ] Database size monitoring

---

## 18. Critical Red Flags ❌

If ANY of these are found, DO NOT DEPLOY:

- [ ] ❌ Hardcoded secrets or API keys in code
- [ ] ❌ Stack traces visible in error responses
- [ ] ❌ No rate limiting on auth endpoints
- [ ] ❌ Email verification bypassed
- [ ] ❌ Weak password requirements
- [ ] ❌ Plaintext passwords in database
- [ ] ❌ Node.js still in development mode (NODE_ENV=development)
- [ ] ❌ MongoDB without authentication
- [ ] ❌ No HTTPS/SSL in production
- [ ] ❌ Cookies without secure flag
- [ ] ❌ CORS set to wildcard (*)
- [ ] ❌ No audit logging
- [ ] ❌ Race conditions not fixed
- [ ] ❌ N+1 queries still present
- [ ] ❌ Vulnerable dependencies (npm audit)

---

## Sign-Off

- [ ] **Security Lead**: _________________ Date: _______
- [ ] **QA Lead**: _________________ Date: _______
- [ ] **DevOps Lead**: _________________ Date: _______
- [ ] **Developer**: _________________ Date: _______

---

## Notes

Add any additional notes, issues found, or remediation actions:

```
[Add notes here]
```

---

**Document Version**: 1.0
**Last Updated**: April 30, 2026
**Next Review**: After each production deployment
