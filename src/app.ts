import "dotenv/config"
import express from "express"
import { openApiSpec } from "@/docs/openapi"
import { errorHandler } from "@/interfaces/middleware/error-handler"
import authRoutes from "@/interfaces/routes/auth.routes"
import userRoutes from "@/interfaces/routes/user.routes"
import roomRoutes from "@/interfaces/routes/room.routes"
import plantRoutes from "@/interfaces/routes/plant.routes"
import careRoutes from "@/interfaces/routes/care.routes"
import gamificationRoutes from "@/interfaces/routes/gamification.routes"
import identificationRoutes from "@/interfaces/routes/identification.routes"
import internalRoutes from "@/interfaces/routes/internal.routes"

const app = express()

if (process.env.NODE_ENV !== "test") {
  app.use((req, res, next) => {
    const startedAt = Date.now()
    res.on("finish", () => {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`)
    })
    next()
  })
}

app.use(express.json({ limit: "12mb" }))

app.use("/auth", authRoutes)
app.use("/user", userRoutes)
app.use("/rooms", roomRoutes)
app.use("/plants", plantRoutes)
app.use("/care", careRoutes)
app.use("/gamification", gamificationRoutes)
app.use("/identifications", identificationRoutes)
app.use("/internal", internalRoutes)

app.get("/openapi.json", (req, res) => {
  res.json(openApiSpec)
})

app.use(errorHandler)

export default app