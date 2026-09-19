import { Router } from "express"
import { loginController, registerController, refreshController, logoutController, firebaseLoginController } from "../controllers/auth.controller"
import { loginRateLimit, passwordResetRateLimit } from "../middleware/rate-limit"
import { forgotPasswordController, resetPasswordController } from "../controllers/auth.controller"
import { verifyEmailController } from "../controllers/verify-email.controller"

const router = Router()

router.post("/register", registerController)
router.post("/login", loginRateLimit,loginController)
router.post("/refresh", refreshController)
router.post("/logout", logoutController)
router.post("/firebase", firebaseLoginController)
router.post("/forgot-password", passwordResetRateLimit, forgotPasswordController)
router.post("/reset-password", passwordResetRateLimit, resetPasswordController)
router.get("/verify-email", verifyEmailController)

export default router