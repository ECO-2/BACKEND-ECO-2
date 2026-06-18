import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findUserByUsername, updateUserOnboarding } from "@/infrastructure/repositories/user.repository"

const onboardingSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  birth_day: z.coerce.date().optional()
})

export const completeOnboarding = async (userId: string, input: unknown) => {
  const data = onboardingSchema.parse(input)

  if (data.username) {
    const existing = await findUserByUsername(data.username)
    if (existing && existing.id !== userId) {
      throw new AppError("Username already taken", 409)
    }
  }

  const user = await updateUserOnboarding(userId, {
    ...data,
    onboarding_completed: true
  })

  return user
}