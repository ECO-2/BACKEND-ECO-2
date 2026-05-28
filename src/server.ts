import "dotenv/config"
import app from "./app"
import { apiReference } from "@scalar/express-api-reference"
import express from "express"

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})