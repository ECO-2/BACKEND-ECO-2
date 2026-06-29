import "dotenv/config"
import express from "express"
import { openApiSpec } from "@/docs/openapi"
import { errorHandler } from "@/interfaces/middleware/error-handler"
import authRoutes from "@/interfaces/routes/auth.routes"
import userRoutes from "@/interfaces/routes/user.routes"
import roomRoutes from "@/interfaces/routes/room.routes"
import plantRoutes from "@/interfaces/routes/plant.routes"
import careRoutes from "@/interfaces/routes/care.routes"

const app = express()

app.use(express.json())

app.use("/auth", authRoutes)
app.use("/user", userRoutes)
app.use("/rooms", roomRoutes)
app.use("/plants", plantRoutes)
app.use("/care", careRoutes)

app.get("/openapi.json", (req, res) => {
  res.json(openApiSpec)
})

app.use(errorHandler)

export default app