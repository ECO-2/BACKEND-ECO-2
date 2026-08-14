import rateLimit from "express-rate-limit"

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,                    // 5 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts, please try again later"
  },
  skipSuccessfulRequests: true 
})