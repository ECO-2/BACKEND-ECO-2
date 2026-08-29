import { Request, Response, NextFunction } from "express"
import { deleteUserUseCase } from "@/application/use-cases/delete-user.usecase"
import { updatePasswordUseCase } from "@/application/use-cases/update-password.usecase"
import { registerDeviceTokenUseCase } from "@/application/use-cases/register-device-token.usecase"

export const deleteMeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteUserUseCase(req.user!.sub, req.body)
    res.status(204).send()
  } catch (error) { next(error) }
}

export const updatePasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await updatePasswordUseCase(req.user!.sub, req.body)
    res.status(204).send()
  } catch (error) { next(error) }
}

export const registerDeviceTokenController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await registerDeviceTokenUseCase(req.user!.sub, req.body)
    res.status(204).send()
  } catch (error) { next(error) }
}