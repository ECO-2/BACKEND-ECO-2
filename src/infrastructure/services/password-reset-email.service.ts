import { resend } from "@/lib/resend"

/**
 * Remitente del correo. `onboarding@resend.dev` es el dominio de pruebas de
 * Resend: solo entrega a la dirección verificada de la cuenta, así que en
 * cuanto haya dominio propio hay que apuntar MAIL_FROM ahí.
 */
const FROM = process.env.MAIL_FROM || "ECO2 <onboarding@resend.dev>"

const MINUTES = 30

export const sendPasswordResetCode = async (to: string, code: string) => {
  const { error } = await resend.emails.send({
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

  // El error se registra pero no se propaga: si se lanzara, el endpoint
  // respondería distinto según el correo existiera o no, que es justo la
  // filtración que el mensaje genérico intenta evitar.
  if (error) {
    console.error("[reset] Resend rechazó el envío:", error)

    // Fuera de producción, el código se imprime para que QA no quede bloqueado
    // cuando Resend rechaza el destinatario. Con el dominio de pruebas
    // (`onboarding@resend.dev`) solo entrega a la dirección verificada de la
    // cuenta, así que sin esto no se puede probar con ningún otro correo.
    //
    // Va detrás de una comprobación explícita de NODE_ENV, y no de un flag
    // propio, para que no exista forma de encenderlo por accidente en el
    // servidor real: ahí el código solo debe existir en la bandeja de quien
    // lo pidió.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[reset] (solo dev) código para ${to}: ${code}`)
    }
    return false
  }
  return true
}
