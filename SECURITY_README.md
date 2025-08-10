# Security Documentation for UFC Picks Application

## 🔒 Security Overview

This document outlines the security measures implemented in the UFC Picks application and provides guidance for secure production deployment.

## 🚨 Critical Security Fixes Implemented

### 1. **Rate Limiting Protection**
- **Issue**: No rate limiting on authentication endpoints
- **Fix**: Implemented comprehensive rate limiting:
  - Authentication endpoints: 5 attempts per 15 minutes
  - General API: 100 requests per 15 minutes
  - API endpoints: 200 requests per 15 minutes

### 2. **Information Disclosure Prevention**
- **Issue**: Error messages exposed sensitive information in production
- **Fix**: Environment-based error handling:
  - Development: Full error details and stack traces
  - Production: Generic error messages only

### 3. **Password Policy Strengthening**
- **Issue**: Weak password requirements (minimum 6 characters)
- **Fix**: Enhanced password policy:
  - Minimum length: 8 characters
  - Maximum length: 128 characters
  - Must contain: uppercase, lowercase, number, special character
  - Regex pattern validation

### 4. **JWT Security Improvements**
- **Issue**: Long token expiration (7 days)
- **Fix**: Reduced token expiration to 24 hours
- **Added**: Token expiration validation in middleware

### 5. **Input Validation & Sanitization**
- **Issue**: Missing input validation on some endpoints
- **Fix**: Comprehensive input validation:
  - Event creation/updates
  - User registration
  - Input sanitization and escaping
  - Length limits and type validation

### 6. **Enhanced Security Headers**
- **Issue**: Basic Helmet configuration
- **Fix**: Comprehensive security headers:
  - Content Security Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - XSS Protection
  - Frame Guard
  - Content Type Sniffing Prevention

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication with short expiration
- Role-based access control (User, Admin, Owner)
- Password hashing with bcrypt (12 salt rounds)
- Account deactivation capability
- Session management

### Input Validation
- Express-validator middleware
- SQL injection prevention
- XSS protection through input sanitization
- Request size limits (10MB max)

### API Security
- CORS configuration with origin validation
- Rate limiting on all endpoints
- Request/response size limits
- Error handling without information leakage

### Database Security
- SQLite with parameterized queries
- User input validation before database operations
- No direct SQL injection vulnerabilities

## 🔧 Configuration

### Environment Variables
```bash
# Security Configuration
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
AUTH_RATE_LIMIT=5
GENERAL_RATE_LIMIT=100
API_RATE_LIMIT=200

# Security Features
ENABLE_RATE_LIMITING=true
ENABLE_STRICT_CORS=true
```

### Production Security Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Change `JWT_SECRET` to a strong, unique value
- [ ] Configure `CORS_ORIGIN` to your production domain
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up proper logging (remove console.log statements)
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

## 🚫 Security Best Practices

### Do's
- ✅ Use strong, unique JWT secrets
- ✅ Implement rate limiting
- ✅ Validate and sanitize all inputs
- ✅ Use HTTPS in production
- ✅ Regular security audits
- ✅ Keep dependencies updated
- ✅ Monitor for suspicious activity

### Don'ts
- ❌ Expose error details in production
- ❌ Use weak passwords
- ❌ Store sensitive data in client-side storage
- ❌ Skip input validation
- ❌ Use default credentials
- ❌ Log sensitive information

## 🔍 Security Testing

### Manual Testing
1. **Authentication Testing**
   - Test rate limiting on login/register
   - Verify JWT expiration
   - Test role-based access control

2. **Input Validation Testing**
   - Test SQL injection attempts
   - Test XSS payloads
   - Test oversized inputs

3. **Authorization Testing**
   - Test admin-only endpoints
   - Verify user isolation
   - Test privilege escalation

### Automated Testing
- Run security linters
- Use OWASP ZAP for vulnerability scanning
- Implement security unit tests
- Regular dependency vulnerability scans

## 🚨 Incident Response

### Security Breach Response
1. **Immediate Actions**
   - Isolate affected systems
   - Revoke compromised tokens
   - Change JWT secret
   - Review logs for intrusion

2. **Investigation**
   - Identify attack vector
   - Assess data exposure
   - Document incident details
   - Implement additional protections

3. **Recovery**
   - Restore from clean backup
   - Update security measures
   - Notify affected users
   - Post-incident review

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

## 📞 Security Contact

For security issues or questions:
- Create a private issue in the repository
- Contact the development team
- Follow responsible disclosure practices

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Security Level**: Enhanced
