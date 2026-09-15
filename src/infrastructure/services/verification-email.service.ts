import { getResend, isEmailConfigured } from "@/lib/resend"

const FROM = process.env.MAIL_FROM || "ECO2 <onboarding@resend.dev>"
const APP_BASE_URL = process.env.APP_BASE_URL || "https://api.eco2app.com"
const isDebugLoggingAllowed = process.env.ALLOW_DEBUG_EMAIL_LOGGING === "true"

export const sendVerificationEmail = async (to: string, token: string) => {
  if (!isEmailConfigured()) {
    console.error("[verify] RESEND_API_KEY no configurada: no se envía el link")
    if (isDebugLoggingAllowed) {
      console.warn(`[verify] (solo dev) link para ${to}: ${APP_BASE_URL}/auth/verify-email?token=${token}`)
    }
    return false
  }

  const verifyUrl = `${APP_BASE_URL}/auth/verify-email?token=${token}`

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: "Verifica tu correo — ECO2",
    text:
      `Verifica tu cuenta de ECO2 abriendo este enlace:\n\n${verifyUrl}\n\n` +
      `El enlace vence en 24 horas. Si no creaste esta cuenta, ignora este correo.`,
    html:
      `<p>Gracias por unirte a ECO2 🌱</p>` +
      `<p>Verifica tu cuenta haciendo click en el siguiente botón:</p>` +
      `<p><a href="${verifyUrl}" style="display:inline-block;background:#0D2B31;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Verificar mi correo</a></p>` +
      `<p style="color:#666;font-size:13px;">O copia este enlace: ${verifyUrl}</p>` +
      `<p style="color:#666;font-size:13px;">El enlace vence en 24 horas. Si no creaste esta cuenta, ignora este correo.</p>`,
  })

  if (error) {
    console.error("[verify] Resend rechazó el envío:", error)
    if (isDebugLoggingAllowed) {
      console.warn(`[verify] (solo dev) link para ${to}: ${verifyUrl}`)
    }
    return false
  }
  return true
}