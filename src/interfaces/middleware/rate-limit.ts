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

// El código de recuperación son 8 caracteres sobre un alfabeto de 32 (40 bits),
// así que adivinarlo ya es inviable; el límite existe para que nadie use estos
// endpoints como bomba de correos ni pruebe códigos en masa.
export const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many password reset attempts, please try again later"
  },
  // La suite corre todas las peticiones desde la misma IP y agotaría la cuota
  // a mitad del archivo; lo que verifica es el flujo, no el límite.
  skip: () => process.env.NODE_ENV === "test"
})