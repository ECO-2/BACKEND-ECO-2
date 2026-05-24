import { Router, Request, Response } from "express"
import { authenticate } from "../middleware/authenticate"

const router = Router()

router.get("/me", authenticate, (req: Request, res: Response) => {
  res.status(200).json({
    message: "Token válido",
    user: req.user
  })
})

export default router