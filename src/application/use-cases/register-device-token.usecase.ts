import { z } from "zod"
import { upsertDeviceToken } from "@/infrastructure/repositories/device-token.repository"

const schema = z.object({
  token: z.string().min(1)
})

export const registerDeviceTokenUseCase = async (userId: string, input: unknown) => {
  const { token } = schema.parse(input)
  await upsertDeviceToken(userId, token)
}