import { Router } from "express"
import { authenticate } from "@/interfaces/middleware/authenticate"
import {
  createPaypalOrderController,
  paypalReturnController,
  paypalCancelController
} from "@/interfaces/controllers/billing.controller"

const router = Router()

router.get("/paypal/return", paypalReturnController)
router.get("/paypal/cancel", paypalCancelController)
router.post("/paypal/orders", authenticate, createPaypalOrderController)

export default router