import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"

describe("DELETE /user/me", () => {
  let accessToken: string

  beforeEach(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    const login = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "secret123" })

    accessToken = login.body.accessToken
  })

  it("should delete the account when password is correct", async () => {
    const res = await request(app)
      .delete("/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: "secret123" })

    expect(res.status).toBe(204)

    const user = await prisma.user.findUnique({ where: { email: "test@eco2.com" } })
    expect(user).toBeNull()
  })

  it("should return 422 when password is missing for a local account", async () => {
    const res = await request(app)
      .delete("/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({})

    expect(res.status).toBe(422)
  })

  it("should return 401 when password is incorrect", async () => {
    const res = await request(app)
      .delete("/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: "wrongpassword" })

    expect(res.status).toBe(401)
  })

  it("should delete all related data (cascade)", async () => {
    const species = await prisma.plantSpecies.create({
      data: {
        scientific_name: "Monstera deliciosa",
        common_name: "Monstera",
        category: "tropical",
        light_requirement: "indirect",
        water_frequency_days: 7,
        humidity_preference: "high",
        air_purification_score: 8,
        min_temperature: 18,
        max_temperature: 30
      }
    })

    const plant = await request(app)
      .post("/plants")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ species_id: species.id, nickname: "Mi Monstera" })

    const res = await request(app)
      .delete("/user/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: "secret123" })

    expect(res.status).toBe(204)

    const remainingPlant = await prisma.userPlant.findUnique({ where: { id: plant.body.id } })
    expect(remainingPlant).toBeNull()
  })

  it("should return 401 without authentication", async () => {
    const res = await request(app)
      .delete("/user/me")
      .send({ password: "secret123" })

    expect(res.status).toBe(401)
  })
})