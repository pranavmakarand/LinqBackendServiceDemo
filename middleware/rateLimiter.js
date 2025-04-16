const rateLimit = require('express-rate-limit');
const RATE_LIMITS = require('./rateLimits'); // Adjust path if needed

// Per-user key extractor using req.userId (after auth middleware)
const createRateLimiter = (options) => rateLimit({
  windowMs: options.windowMs || 60 * 1000,       // 1 minute default
  max: options.max || 60,                        // default max
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.'
    });
  },
  keyGenerator: (req) => req.userId
});

module.exports = {
  contactGetLimiter: createRateLimiter({ max: RATE_LIMITS.CONTACT.GET }),       
  contactDetailLimiter: createRateLimiter({ max: RATE_LIMITS.CONTACT.GET }), 
  contactPostLimiter: createRateLimiter({ max: RATE_LIMITS.CONTACT.POST }),    
  contactPutLimiter: createRateLimiter({ max: RATE_LIMITS.CONTACT.PUT }),      
  contactDeleteLimiter: createRateLimiter({ max: RATE_LIMITS.CONTACT.DELETE }),

  noteGetLimiter: createRateLimiter({ max: RATE_LIMITS.NOTE.GET }),
  notePostLimiter: createRateLimiter({ max: RATE_LIMITS.NOTE.POST }),
  notePutLimiter: createRateLimiter({ max: RATE_LIMITS.NOTE.PUT }),
  noteDeleteLimiter: createRateLimiter({ max: RATE_LIMITS.NOTE.DELETE })
};