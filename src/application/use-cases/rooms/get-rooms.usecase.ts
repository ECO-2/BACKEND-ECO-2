import { findRoomsByUser } from "@/infrastructure/repositories/room.repository"

export const getRoomsUseCase = async (userId: string) => {
  return findRoomsByUser(userId)
}