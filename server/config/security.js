const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '24h',
    refreshExpiresIn: '7d'
  },

  // Rate Limiting Configuration
  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.AUTH_RATE_LIMIT) || 5, // 5 attempts per window
      message: 'Too many authentication attempts, please try again later.'
    },
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.GENERAL_RATE_LIMIT) || 100, // 100 requests per window
      message: 'Too many requests from this IP, please try again later.'
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.API_RATE_LIMIT) || 200, // 200 requests per window
      message: 'API rate limit exceeded, please try again later.'
    }
  },

  // Password Policy
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // Helmet Configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none"],
        objectSrc: ["'none"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'deny' }
  },

  // Input Validation Limits
  validation: {
    maxStringLength: 1000,
    maxArrayLength: 100,
    maxObjectDepth: 5
  },

  // Session Security
  session: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
};

module.exports = securityConfig;
