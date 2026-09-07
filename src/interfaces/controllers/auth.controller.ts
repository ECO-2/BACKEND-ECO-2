
import { Request, Response } from "express"
import { registerUser } from "@/application/use-cases/register-user.usecase"
import { loginUser } from "@/application/use-cases/login-user.usecase"
import { refreshToken } from "@/application/use-cases/refresh-token.usecase"
import { logoutUser } from "@/application/use-cases/logout-user.usecase"
import { NextFunction } from "express"
import { firebaseLogin } from "@/application/use-cases/firebase-login.usecase"
import { forgotPasswordUseCase } from "@/application/use-cases/forgot-password.usecase"
import { resetPasswordUseCase } from "@/application/use-cases/reset-password.usecase"

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {

    // Antes esto era `console.log(req.body)`, que dejaba la contraseña en
    // claro en el log del servidor en cada registro.
    console.log("Registering user:", req.body?.email)
    const user = await registerUser(req.body)

    res.status(201).json({
      id: user.id,
      email: user.email
    })
  } catch (error: any) {
    next(error)
  }
}

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken, refreshToken } = await loginUser(req.body)

    res.status(200).json({ accessToken, refreshToken })
  } catch (error) {
    next(error) 
  }
}


export const refreshController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokens = await refreshToken(req.body)
    res.status(200).json(tokens)
  } catch (error) {
    next(error)
  }
}

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logoutUser(req.body)
    res.status(204).send() // 204 = No Content — éxito sin cuerpo
  } catch (error) {
    next(error)
  }
}

export const firebaseLoginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokens = await firebaseLogin(req.body)
    res.status(200).json(tokens)
  } catch (error) {
    next(error)
  }
}

export const forgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await forgotPasswordUseCase(req.body)
    res.status(200).json({ message: "If an account exists with that email, a reset code has been sent" })
  } catch (error) {
    next(error)
  }
}

export const resetPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await resetPasswordUseCase(req.body)
    res.status(200).json({ message: "Password reset successfully" })
  } catch (error) {
    next(error)
  }
}