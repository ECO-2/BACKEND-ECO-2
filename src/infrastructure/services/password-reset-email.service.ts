import { getResend, isEmailConfigured } from "@/lib/resend"

const FROM = process.env.MAIL_FROM || "ECO2 <no-reply@eco2app.com>"
const isDebugLoggingAllowed = process.env.ALLOW_DEBUG_EMAIL_LOGGING === "true"

const MINUTES = 30

export const sendPasswordResetCode = async (to: string, code: string) => {
  if (!isEmailConfigured()) {
    console.error("[reset] RESEND_API_KEY no configurada: no se envia el codigo")
    if (isDebugLoggingAllowed) {
      console.warn(`[reset] (solo dev) codigo para ${to}: ${code}`)
    }
    return
  }

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Tu código de recuperación ECO2: ${code}`,
    text:
      `Tu código para restablecer la contraseña de ECO2 es: ${code}\n\n` +
      `Pégalo en la app junto con tu nueva contraseña. Vence en ${MINUTES} minutos.\n\n` +
      `Si no pediste este cambio, ignora este correo: tu contraseña sigue igual.`,
    html:
      `<p>Tu código para restablecer la contraseña de ECO2 es:</p>` +
      `<p style="font-size:28px;font-weight:700;letter-spacing:3px;font-family:monospace">${code}</p>` +
      `<p>Pégalo en la app junto con tu nueva contraseña. Vence en ${MINUTES} minutos.</p>` +
      `<p style="color:#666">Si no pediste este cambio, ignora este correo: tu contraseña sigue igual.</p>`,
  })

  if (error) {
    console.error("[reset] Resend rechazó el envío:", error)
    if (isDebugLoggingAllowed) {
      console.warn(`[reset] (solo dev) código para ${to}: ${code}`)
    }
    return false
  }
  return true
}
