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
    html: `
      <!DOCTYPE html>
      <html>
      <head>
      <meta charset="UTF-8">
      </head>
      <body style="margin:0; padding:0; background-color:#F2F4EB; font-family: Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F4EB; padding:32px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background-color:#0D2B31; padding:24px 32px; text-align:center;">
                    <img src="${APP_BASE_URL}/icono.png" alt="ECO2" style="height:60px; display:inline-block;">
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <h1 style="color:#0D2B31; font-size:20px; margin:0 0 16px;">Verifica tu correo electrónico</h1>
                    <p style="color:#444444; font-size:14px; line-height:1.6; margin:0 0 24px;">
                      ¡Gracias por unirte a ECO2! Verifica tu dirección de correo para activar tu cuenta y ganar 10 semillas de regalo 🌱.
                    </p>

                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background-color:#B4E000; border-radius:8px;">
                          <a href="${verifyUrl}" style="display:inline-block; padding:14px 32px; color:#0D2B31; font-weight:bold; font-size:14px; text-decoration:none;">
                            Verificar mi correo
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="color:#999999; font-size:12px; line-height:1.6; margin:24px 0 0;">
                      Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                      <a href="${verifyUrl}" style="color:#0D2B31; word-break:break-all;">${verifyUrl}</a>
                    </p>

                    <p style="color:#999999; font-size:12px; line-height:1.6; margin:16px 0 0;">
                      Este enlace vence en 24 horas. Si no creaste esta cuenta, puedes ignorar este correo.
                    </p>
                  </td>
                </tr>

              </table>

              <!-- Footer -->
              <table width="480" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td align="center">
                    <p style="color:#999999; font-size:11px;">© 2026 ECO2. Todos los derechos reservados.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
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