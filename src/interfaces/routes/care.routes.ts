import { Router } from "express"
import { authenticate } from "@/interfaces/middleware/authenticate"
import {
  createTaskController,
  getTasksController,
  getAllTasksController,
  completeTaskController,
  updateTaskController,
  deleteTaskController,
  createCareLogController,
  getCareLogsController,
  deleteCareLogController
} from "@/interfaces/controllers/care.controller"

const router = Router()

router.use(authenticate)

router.get("/tasks", getAllTasksController)
router.post("/tasks", createTaskController)
router.get("/plants/:plantId/tasks", getTasksController)
router.patch("/tasks/:taskId", updateTaskController)
router.patch("/tasks/:taskId/complete", completeTaskController)
router.delete("/tasks/:taskId", deleteTaskController)

router.post("/logs", createCareLogController)
router.get("/plants/:plantId/logs", getCareLogsController)
router.delete("/logs/:logId", deleteCareLogController)

export default router