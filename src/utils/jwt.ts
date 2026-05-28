import fs from "fs"
import path from "path"
import jwt from "jsonwebtoken"

const getPrivateKey = (): string => {
  if (process.env.JWT_PRIVATE_KEY) {
    return process.env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n")
  }
  return fs.readFileSync(path.join(__dirname, "../../keys/private.key"), "utf8")
}

const getPublicKey = (): string => {
  if (process.env.JWT_PUBLIC_KEY) {
    return process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n")
  }
  return fs.readFileSync(path.join(__dirname, "../../keys/public.key"), "utf8")
}

export interface JwtPayload {
  sub: string 
  email: string
}

export const generateAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, getPrivateKey(), {
    algorithm: "RS256",
    expiresIn: "15m"
  })
}

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, getPublicKey(), {
      algorithms: ["RS256"]
    })
  } catch (error) {
    throw new Error("Invalid token")
  }
}

