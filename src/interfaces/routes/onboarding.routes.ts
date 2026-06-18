import { Router } from "express"
import { authenticate } from "@/interfaces/middleware/authenticate"
import { completeOnboardingController } from "@/interfaces/controllers/onboarding.controller"

const router = Router()

router.patch("/onboarding", authenticate, completeOnboardingController)

export default router