import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { AppError } from "@/core/errors/AppError"
import { AVATARS, findAvatar, freeAvatarIds } from "@/domain/avatars/catalog"

const purchaseSchema = z.object({
  avatar_id: z.string().min(1)
})

/** Ids que el usuario ha comprado (los gratuitos no se guardan). */
export const ownedAvatarIds = async (userId: string): Promise<string[]> => {
  const rows = await prisma.userAvatar.findMany({
    where: { user_id: userId },
    select: { avatar_id: true }
  })
  return rows.map(r => r.avatar_id)
}

/** Catálogo con precio, si es gratuito y si el usuario ya lo tiene. */
export const listAvatarsUseCase = async (userId: string) => {
  const owned = await ownedAvatarIds(userId)
  const free = freeAvatarIds()
  return {
    avatars: AVATARS.map(a => ({
      id: a.id,
      cost: a.cost,
      free: a.cost === 0,
      owned: a.cost === 0 || owned.includes(a.id)
    })),
    owned: [...free, ...owned]
  }
}

/**
 * Compra un avatar con semillas.
 *
 * Todo va dentro de una transacción: sin ella, un fallo entre descontar y
 * registrar la propiedad dejaría al usuario sin semillas y sin avatar. El
 * descuento se hace condicionado al saldo en la propia consulta, para que dos
 * peticiones simultáneas no puedan gastar las mismas semillas dos veces.
 */
export const purchaseAvatarUseCase = async (userId: string, input: unknown) => {
  const { avatar_id } = purchaseSchema.parse(input)

  const item = findAvatar(avatar_id)
  if (!item) throw new AppError("avatar_not_found", 404)
  if (item.cost === 0) throw new AppError("avatar_is_free", 400)

  const already = await prisma.userAvatar.findUnique({
    where: { user_id_avatar_id: { user_id: userId, avatar_id } }
  })
  if (already) throw new AppError("avatar_already_owned", 409)

  return prisma.$transaction(async tx => {
    const updated = await tx.userProgress.updateMany({
      where: { user_id: userId, seeds: { gte: item.cost } },
      data: { seeds: { decrement: item.cost } }
    })
    if (updated.count === 0) {
      throw new AppError("not_enough_seeds", 402)
    }

    await tx.userAvatar.create({
      data: { user_id: userId, avatar_id }
    })
    await tx.seedTransaction.create({
      data: { user_id: userId, amount: -item.cost, reason: `avatar:${avatar_id}` }
    })

    const progress = await tx.userProgress.findUnique({ where: { user_id: userId } })
    return { avatar_id, cost: item.cost, seeds: progress?.seeds ?? 0 }
  })
}
