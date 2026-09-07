import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { PLAN_FREE, PLAN_PLUS } from "@/domain/plans/limits"
import { getPlanStatus } from "@/application/services/plan-limits.service"

/**
 * Activación de O2+ **simulada**.
 *
 * No hay cobro: la app es un trabajo universitario y la pasarela es una
 * maqueta. Este endpoint solo marca el plan y le pone fecha de fin, para que
 * los límites y la insignia se comporten como lo harían de verdad.
 *
 * Se deja explícito en el nombre del campo devuelto (`simulated: true`) para
 * que nadie lo confunda con una suscripción real si el proyecto continúa.
 */

const activateSchema = z.object({
  // Meses de suscripción. 12 por defecto, que es el plan anual que muestra la
  // pantalla de pago.
  months: z.number().int().min(1).max(24).optional()
})

export const activatePlusUseCase = async (userId: string, input: unknown) => {
  const { months = 12 } = activateSchema.parse(input ?? {})

  const now = new Date()
  // Si ya tenía O2+ vigente, se suma al tiempo restante en vez de recortarlo.
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan_expires_at: true, plan_type: true }
  })
  const base =
    current?.plan_type === PLAN_PLUS &&
    current.plan_expires_at &&
    current.plan_expires_at > now
      ? current.plan_expires_at
      : now

  const expiresAt = new Date(base)
  expiresAt.setMonth(expiresAt.getMonth() + months)

  await prisma.user.update({
    where: { id: userId },
    data: { plan_type: PLAN_PLUS, plan_expires_at: expiresAt }
  })

  return { ...(await getPlanStatus(userId, now)), simulated: true }
}

/** Vuelve al plan gratuito de inmediato. */
export const cancelPlusUseCase = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { plan_type: PLAN_FREE, plan_expires_at: null }
  })
  return getPlanStatus(userId)
}
