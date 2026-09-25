import { Router } from "express"
import { authenticate } from "@/interfaces/middleware/authenticate"
import { requireDeviceKey } from "@/interfaces/middleware/device-auth"
import {
  createCo2ReadingController,
  getLatestCo2ReadingController,
  getCo2ReadingsController
} from "@/interfaces/controllers/co2-reading.controller"

const router = Router()

router.post("/", requireDeviceKey, createCo2ReadingController)

router.use(authenticate)
router.get("/latest", getLatestCo2ReadingController)
router.get("/", getCo2ReadingsController)

export default router