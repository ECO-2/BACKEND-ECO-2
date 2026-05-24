import fs from "fs"
import path from "path"
import jwt from "jsonwebtoken"

const privateKey = fs.readFileSync(
  path.join(__dirname, "../../keys/private.key"),
  "utf8"
)

const publicKey = fs.readFileSync(
  path.join(__dirname, "../../keys/public.key"),
  "utf8"
)

export interface JwtPayload {
  sub: string 
  email: string
}

export const generateAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "15m"
  })
}

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, publicKey, {
      algorithms: ["RS256"]
    })
  } catch (error) {
    throw new Error("Invalid token")
  }
}

