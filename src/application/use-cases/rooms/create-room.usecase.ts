import { z } from "zod"
import { createRoom } from "@/infrastructure/repositories/room.repository"

const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  size_m2: z.number().positive().optional(),
  light_level: z.enum(["low", "medium", "high"]).optional()
})

export const createRoomUseCase = async (userId: string, input: unknown) => {
  const data = createRoomSchema.parse(input)
  return createRoom(userId, data)
}