import { Router, Request, Response } from "express"
import { authenticate } from "../middleware/authenticate"
import { findUserById } from "@/infrastructure/repositories/user.repository"

const router = Router()

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await findUserById(req.user!.sub)
    if (!user) return res.status(404).json({ error: "User not found" })

    res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_url: user.avatar_url,
      role: user.role,
      plan_type: user.plan_type,
      mfa_enabled: user.mfa_enabled,
      created_at: user.created_at,
    })
  } catch (error) {
    next(error)
  }
})

export default router