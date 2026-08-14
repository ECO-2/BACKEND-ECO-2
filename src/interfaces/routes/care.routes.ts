import { Router } from "express"
import { authenticate } from "@/interfaces/middleware/authenticate"
import {
  createTaskController,
  getTasksController,
  completeTaskController,
  createCareLogController,
  getCareLogsController
} from "@/interfaces/controllers/care.controller"

const router = Router()

router.use(authenticate)

router.post("/tasks", createTaskController)
router.get("/plants/:plantId/tasks", getTasksController)
router.patch("/tasks/:taskId/complete", completeTaskController)

router.post("/logs", createCareLogController)
router.get("/plants/:plantId/logs", getCareLogsController)

export default router