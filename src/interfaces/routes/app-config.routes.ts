import { Router } from "express"
import { getAppConfigController } from "@/interfaces/controllers/app-config.controller"

const router = Router()
router.get("/", getAppConfigController)

export default router