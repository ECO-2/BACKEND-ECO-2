import { Router } from "express"
import { requireInternalKey } from "@/interfaces/middleware/internal-auth"
import { runRemindersController } from "@/interfaces/controllers/internal.controller"

const router = Router()

router.post("/run-reminders", requireInternalKey, runRemindersController)

export default router