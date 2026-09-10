import crypto from "crypto"

/**
 * Código de recuperación de contraseña, pensado para que la persona lo copie
 * del correo y lo pegue en la app.
 *
 * El esquema anterior era un token de 64 caracteres hexadecimales con la marca
 * de tiempo incrustada (`<ms>.<hex>`). Servía para un enlace, pero es
 * impracticable de teclear o pegar sin errores, y la app no tiene deep link
 * configurado que lo reciba.
 *
 * Alfabeto sin caracteres ambiguos (nada de I, O, 0, 1) porque el código se lee
 * a ojo desde un correo. Son 32 símbolos en 8 posiciones = 40 bits de entropía,
 * suficiente para que no se pueda adivinar por fuerza bruta, y aun así corto.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 8

export const RESET_CODE_TTL_MS = 30 * 60 * 1000 // 30 minutos

/** Genera un código nuevo, ya con el guion de cortesía: `ABCD-2345`. */
export const generateResetCode = (): string => {
  // randomInt es rejection-sampling: no sesga el alfabeto como haría `% 32`
  // sobre un byte aleatorio.
  let code = ""
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)]
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

/**
 * Deja el código en su forma canónica antes de compararlo: quita guiones y
 * espacios, y sube a mayúsculas. Así da igual si se pega `abcd-2345`,
 * `ABCD 2345` o `ABCD2345`.
 */
export const normalizeResetCode = (raw: string): string =>
  raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

export const hashResetCode = (code: string): string =>
  crypto.createHash("sha256").update(normalizeResetCode(code)).digest("hex")

/**
 * Empaqueta el vencimiento junto al hash para guardarlos en la única columna
 * que existe (`reset_token_hash`), evitando una migración solo por una fecha.
 * Formato: `<expiraEnMs>.<sha256>`.
 */
export const packResetToken = (code: string, now = Date.now()): string =>
  `${now + RESET_CODE_TTL_MS}.${hashResetCode(code)}`

export const unpackResetToken = (
  stored: string
): { expiresAt: number; hash: string } | null => {
  const separator = stored.indexOf(".")
  if (separator < 0) return null
  const expiresAt = Number(stored.slice(0, separator))
  const hash = stored.slice(separator + 1)
  if (!Number.isFinite(expiresAt) || !hash) return null
  return { expiresAt, hash }
}
