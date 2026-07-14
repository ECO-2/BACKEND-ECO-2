import { Router } from "express"
import { authenticate } from "@/interfaces/middleware/authenticate"
import {
  identifyPlantController,
  getIdentificationsController
} from "@/interfaces/controllers/identification.controller"

const router = Router()

router.use(authenticate)

router.post("/", identifyPlantController)
router.get("/", getIdentificationsController)

export default router