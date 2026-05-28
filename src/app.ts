import "dotenv/config"
import express from "express"
import authRoutes from "./interfaces/routes/auth.routes"
import { openApiSpec } from "./docs/openapi"
import { errorHandler } from "./interfaces/middleware/error-handler"
import userRoutes from "./interfaces/routes/user.routes"

const app = express()

app.use(express.json())

app.use("/auth", authRoutes)
app.use("/user", userRoutes)
app.get("/openapi.json", (req, res) => {
  res.json(openApiSpec)
})




app.use(errorHandler)

export default app