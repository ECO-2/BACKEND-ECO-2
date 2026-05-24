
import { Request, Response } from "express"
import { registerUser } from "@/application/use-cases/register-user.usecase"
import { loginUser } from "@/application/use-cases/login-user.usecase"
import { refreshToken } from "@/application/use-cases/refresh-token.usecase"
import { logoutUser } from "@/application/use-cases/logout-user.usecase"
import { NextFunction } from "express"
import { firebaseLogin } from "@/application/use-cases/firebase-login.usecase"

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {

    console.log("Registering user with data:", req.body);
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