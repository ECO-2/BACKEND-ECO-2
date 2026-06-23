import { AppError } from "@/core/errors/AppError"
import { findRoomById } from "@/infrastructure/repositories/room.repository"

export const getRoomUseCase = async (userId: string, roomId: string) => {
  const room = await findRoomById(roomId, userId)
  if (!room) throw new AppError("Room not found", 404)
  return room
}