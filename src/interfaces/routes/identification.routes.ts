import { Router } from "express"
import { authenticate } from "@/interfaces/middleware/authenticate"
import {
  identifyPlantController,
  getIdentificationsController,
  identifyWithFallbackController
} from "@/interfaces/controllers/identification.controller"

const router = Router()

router.use(authenticate)

router.post("/", identifyPlantController)
router.get("/", getIdentificationsController)
router.post("/fallback", identifyWithFallbackController)

export default router