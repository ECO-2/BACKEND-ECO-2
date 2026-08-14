import { Router } from "express"
import { authenticate } from "@/interfaces/middleware/authenticate"
import {
  createRoomController,
  getRoomsController,
  getRoomController,
  updateRoomController,
  deleteRoomController
} from "@/interfaces/controllers/room.controller"

const router = Router()

router.use(authenticate)

router.post("/", createRoomController)
router.get("/", getRoomsController)
router.get("/:id", getRoomController)
router.patch("/:id", updateRoomController)
router.delete("/:id", deleteRoomController)

export default router