import rateLimit from "express-rate-limit";

// Rate limiter for booking submission to prevent accidental spam / abuse
export const bookingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 booking requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many booking requests from this IP. Please try again in 15 minutes.",
    error: "Too many booking requests from this IP. Please try again in 15 minutes.",
  },
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
    error: "Too many requests. Please slow down.",
  },
});
