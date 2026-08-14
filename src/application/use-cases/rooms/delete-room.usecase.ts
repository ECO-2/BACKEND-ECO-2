import { AppError } from "@/core/errors/AppError"
import { findRoomById, softDeleteRoom } from "@/infrastructure/repositories/room.repository"

export const deleteRoomUseCase = async (userId: string, roomId: string) => {
  const room = await findRoomById(roomId, userId)
  if (!room) throw new AppError("Room not found", 404)
  await softDeleteRoom(roomId)
}