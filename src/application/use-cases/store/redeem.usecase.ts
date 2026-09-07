import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { AppError } from "@/core/errors/AppError"
import { findStoreItem } from "@/domain/store/catalog"
import { PLAN_PLUS } from "@/domain/plans/limits"
import { getPlanStatus } from "@/application/services/plan-limits.service"

const redeemSchema = z.object({
  item_id: z.string().min(1)
})

/**
 * Canjea un artículo de la tienda con semillas.
 *
 * Descuenta y entrega dentro de la misma transacción. La versión anterior de la
 * tienda solo descontaba: quien compraba O2+ perdía las semillas y se quedaba
 * en el plan gratuito.
 *
 * El descuento va condicionado al saldo en la propia consulta, para que dos
 * peticiones simultáneas no gasten las mismas semillas.
 */
export const redeemStoreItemUseCase = async (userId: string, input: unknown) => {
  const { item_id } = redeemSchema.parse(input)

  const item = findStoreItem(item_id)
  if (!item) throw new AppError("item_not_found", 404)

  const now = new Date()

  await prisma.$transaction(async tx => {
    const spent = await tx.userProgress.updateMany({
      where: { user_id: userId, seeds: { gte: item.cost } },
      data: { seeds: { decrement: item.cost } }
    })
    if (spent.count === 0) throw new AppError("not_enough_seeds", 402)

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        plan_type: true,
        plan_expires_at: true,
        rental_slots_expires_at: true,
        rental_plant_slots: true
      }
    })
    if (!user) throw new AppError("User not found", 404)

    const data: Record<string, unknown> = {}

    if (item.plusDays) {
      // Si ya tenía O2+ vigente se suma al tiempo restante, no se recorta.
      const base =
        user.plan_type === PLAN_PLUS &&
        user.plan_expires_at &&
        user.plan_expires_at > now
          ? user.plan_expires_at
          : now
      const expires = new Date(base)
      expires.setDate(expires.getDate() + item.plusDays)
      data.plan_type = PLAN_PLUS
      data.plan_expires_at = expires
    }

    if (item.slots) {
      data.extra_plant_slots = { increment: item.slots }
    }

    if (item.rentalSlots && item.rentalDays) {
      // Un alquiler ya caducado se descarta antes de sumar, para que no se
      // acumulen macetas que vencieron hace tiempo.
      const active =
        user.rental_slots_expires_at !== null &&
        user.rental_slots_expires_at > now
      const base = active ? user.rental_slots_expires_at! : now
      const expires = new Date(base)
      expires.setDate(expires.getDate() + item.rentalDays)
      data.rental_plant_slots = active
        ? { increment: item.rentalSlots }
        : item.rentalSlots
      data.rental_slots_expires_at = expires
    }

    await tx.user.update({ where: { id: userId }, data })
    await tx.seedTransaction.create({
      data: { user_id: userId, amount: -item.cost, reason: `store:${item_id}` }
    })
  })

  const progress = await prisma.userProgress.findUnique({
    where: { user_id: userId }
  })
  return {
    item_id,
    cost: item.cost,
    seeds: progress?.seeds ?? 0,
    plan: await getPlanStatus(userId, now)
  }
}
