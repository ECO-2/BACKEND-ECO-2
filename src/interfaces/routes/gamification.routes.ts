import { Router } from "express"
import { authenticate } from "@/interfaces/middleware/authenticate"
import { requireAdmin } from "@/interfaces/middleware/authorize"
import {
  getProgressController,
  addXpController,
  addSeedsController,
  updateProgressController,
  getXpLogsController,
  getSeedTransactionsController,
  getAllAchievementsController,
  createAchievementController,
  updateAchievementController,
  getUserAchievementsController,
  unlockAchievementController
} from "@/interfaces/controllers/gamification.controller"

const router = Router()

router.use(authenticate)

router.get("/progress", getProgressController)
router.patch("/progress", updateProgressController)
router.post("/progress/xp", addXpController)
router.post("/progress/seeds", addSeedsController)
router.get("/progress/xp-logs", getXpLogsController)
router.get("/progress/seed-transactions", getSeedTransactionsController)

router.get("/achievements", getAllAchievementsController)
router.get("/achievements/me", getUserAchievementsController)
router.post("/achievements/:id/unlock", unlockAchievementController)

router.post("/achievements", requireAdmin, createAchievementController)
router.patch("/achievements/:id", requireAdmin, updateAchievementController)

export default router