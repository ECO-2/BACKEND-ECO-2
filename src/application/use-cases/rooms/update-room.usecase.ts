import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findRoomById, updateRoom } from "@/infrastructure/repositories/room.repository"

const updateRoomSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  size_m2: z.number().positive().optional(),
  light_level: z.enum(["low", "medium", "high"]).optional()
})

export const updateRoomUseCase = async (userId: string, roomId: string, input: unknown) => {
  const data = updateRoomSchema.parse(input)
  const room = await findRoomById(roomId, userId)
  if (!room) throw new AppError("Room not found", 404)
  return updateRoom(roomId, data)
}