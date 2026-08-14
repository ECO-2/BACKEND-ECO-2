import "dotenv/config"
import app from "./app"
import { apiReference } from "@scalar/express-api-reference"
import express from "express"
import { mountAdmin } from "./admin/index"

const PORT = process.env.PORT || 3000

app.use(express.static('public'))

app.use(
  "/docs",
  apiReference({
    theme: "moon",
    url: "/openapi.json",
    pageTitle: "ECO2 API Docs",
    favicon: '/icono.png'
  })
)

async function start() {
  await mountAdmin(app)

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Admin backoffice available at /admin`)
  })
}

start()