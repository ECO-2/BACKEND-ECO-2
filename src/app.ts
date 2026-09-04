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

// Log simple de cada petición (método, ruta, status, duración) — sin esto
// la consola de `npm run dev` se queda en silencio salvo que algo truene,
// lo que hace muy difícil ver en vivo qué está pidiendo la app mientras la
// usas. Se omite en tests para no ensuciar la salida de Jest.
if (process.env.NODE_ENV !== "test") {
  app.use((req, res, next) => {
    const startedAt = Date.now()
    res.on("finish", () => {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`)
    })
    next()
  })
}

// El límite por defecto de express.json() es 100kb — una foto real de la
// cámara codificada en base64 (para /identifications/fallback) pesa varios
// MB, así que con el default cualquier escaneo fallaba con
// "PayloadTooLargeError" antes de siquiera llegar al controlador.
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