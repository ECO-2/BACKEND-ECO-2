import { Request, Response, NextFunction } from "express"
import { createRoomUseCase } from "@/application/use-cases/rooms/create-room.usecase"
import { getRoomsUseCase } from "@/application/use-cases/rooms/get-rooms.usecase"
import { getRoomUseCase } from "@/application/use-cases/rooms/get-room.usecase"
import { updateRoomUseCase } from "@/application/use-cases/rooms/update-room.usecase"
import { deleteRoomUseCase } from "@/application/use-cases/rooms/delete-room.usecase"

export const createRoomController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await createRoomUseCase(req.user!.sub, req.body)
    res.status(201).json(room)
  } catch (error) { next(error) }
}

export const getRoomsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await getRoomsUseCase(req.user!.sub)
    res.status(200).json(rooms)
  } catch (error) { next(error) }
}

export const getRoomController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await getRoomUseCase(req.user!.sub, req.params.id as string)
    res.status(200).json(room)
  } catch (error) { next(error) }
}

export const updateRoomController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await updateRoomUseCase(req.user!.sub, req.params.id as string, req.body)
    res.status(200).json(room)
  } catch (error) { next(error) }
}

export const deleteRoomController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteRoomUseCase(req.user!.sub, req.params.id as string)
    res.status(204).send()
  } catch (error) { next(error) }
}