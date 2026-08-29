import { Router, Request, Response } from "express"
import { authenticate } from "../middleware/authenticate"
import { findUserById } from "@/infrastructure/repositories/user.repository"
import { completeOnboardingController } from "@/interfaces/controllers/onboarding.controller"
import { updateProfileController } from "@/interfaces/controllers/profile.controller"
import { deleteMeController, updatePasswordController } from "@/interfaces/controllers/user.controller"
import { registerDeviceTokenController } from "@/interfaces/controllers/user.controller"

const router = Router()

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await findUserById(req.user!.sub)
    if (!user) return res.status(404).json({ error: "User not found" })

    res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_url: user.avatar_url,
      role: user.role,
      plan_type: user.plan_type,
      mfa_enabled: user.mfa_enabled,
      onboarding_completed: user.onboarding_completed,
      created_at: user.created_at,
    })
  } catch (error) {
    next(error)
  }
})

router.patch("/onboarding", authenticate, completeOnboardingController)
router.patch("/profile", authenticate, updateProfileController)
router.delete("/me", authenticate, deleteMeController)
router.patch("/password", authenticate, updatePasswordController)
router.post("/device-token", authenticate, registerDeviceTokenController)

export default router