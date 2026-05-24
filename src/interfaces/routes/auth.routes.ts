import { Router } from "express"
import { loginController, registerController, refreshController, logoutController, firebaseLoginController } from "../controllers/auth.controller"
import { loginRateLimit } from "../middleware/rate-limit"

const router = Router()

router.post("/register", registerController)
router.post("/login", loginRateLimit,loginController)
router.post("/refresh", refreshController)
router.post("/logout", logoutController)
router.post("/firebase", firebaseLoginController)

export default router