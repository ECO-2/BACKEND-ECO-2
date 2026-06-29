import { Router } from "express"
import { authenticate } from "@/interfaces/middleware/authenticate"
import {
  getAllSpeciesController,
  getSpeciesByIdController,
  createUserPlantController,
  getUserPlantsController,
  getUserPlantByIdController,
  updateUserPlantController,
  deleteUserPlantController
} from "@/interfaces/controllers/plant.controller"

const router = Router()

// Catálogo de especies — público, no requiere auth
router.get("/species", getAllSpeciesController)
router.get("/species/:id", getSpeciesByIdController)

// Plantas del usuario — requiere auth
router.use(authenticate)
router.post("/", createUserPlantController)
router.get("/", getUserPlantsController)
router.get("/:id", getUserPlantByIdController)
router.patch("/:id", updateUserPlantController)
router.delete("/:id", deleteUserPlantController)

export default router