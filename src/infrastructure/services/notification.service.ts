import { firebaseAdmin } from "@/lib/firebase"
import { getResend, isEmailConfigured } from "@/lib/resend"
import { findUserById } from "@/infrastructure/repositories/user.repository"
import { findDeviceTokensByUser, deleteDeviceToken } from "@/infrastructure/repositories/device-token.repository"

export const notifyUser = async (
  userId: string,
  { title, body }: { title: string; body: string }
): Promise<boolean> => {
  const user = await findUserById(userId)
  if (!user || !user.notifications_enabled) return false

  const tokens = await findDeviceTokensByUser(userId)

  if (tokens.length > 0) {
    const results = await firebaseAdmin.messaging().sendEachForMulticast({
      tokens: tokens.map(t => t.token),
      notification: { title, body }
    })

    results.responses.forEach((r, i) => {
      if (!r.success) {
        deleteDeviceToken(tokens[i].token).catch(() => {})
      }
    })
  }

  // Sin clave de correo la notificacion push ya se ha enviado: el correo es
  // el refuerzo, no el canal principal, y su ausencia no debe hacer fallar
  // nada.
  if (user.email && isEmailConfigured()) {
    getResend().emails.send({
      from: "ECO2 <onboarding@resend.dev>",
      to: user.email,
      subject: title,
      html: `<p>${body}</p>`
    }).catch(err => console.error("Failed to send email notification:", err))
  }

  return true
}