import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"

describe("Plants", () => {
  let accessToken: string
  let speciesId: string

  beforeEach(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "secret123" })

    accessToken = res.body.accessToken

    // Especie de prueba creada directamente con Prisma
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
    speciesId = species.id
  })

  // SPECIES
  describe("GET /plants/species", () => {
    it("should return list of species", async () => {
      const res = await request(app).get("/plants/species")

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].common_name).toBe("Monstera")
    })

    it("should not require authentication", async () => {
      const res = await request(app).get("/plants/species")
      expect(res.status).toBe(200)
    })
  })

  describe("GET /plants/species/:id", () => {
    it("should return a species by id", async () => {
      const res = await request(app).get(`/plants/species/${speciesId}`)

      expect(res.status).toBe(200)
      expect(res.body.scientific_name).toBe("Monstera deliciosa")
    })

    it("should return 404 for non-existent species", async () => {
      const res = await request(app)
        .get("/plants/species/00000000-0000-0000-0000-000000000000")

      expect(res.status).toBe(404)
    })
  })

  // USER PLANTS
  describe("POST /plants", () => {
    it("should add a plant to user collection", async () => {
      const res = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId, nickname: "Mi Monstera" })

      expect(res.status).toBe(201)
      expect(res.body.nickname).toBe("Mi Monstera")
      expect(res.body.species.common_name).toBe("Monstera")
      expect(res.body.health_status).toBe("good")
    })

    it("should add a plant with only species_id", async () => {
      const res = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId })

      expect(res.status).toBe(201)
      expect(res.body.species_id).toBe(speciesId)
    })

    it("should return 404 for non-existent species", async () => {
      const res = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: "00000000-0000-0000-0000-000000000000" })

      expect(res.status).toBe(404)
    })

    it("should return 422 with invalid species_id format", async () => {
      const res = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: "not-a-uuid" })

      expect(res.status).toBe(422)
    })

    it("should return 422 with invalid health_status", async () => {
      const res = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId, health_status: "dead" })

      expect(res.status).toBe(422)
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .post("/plants")
        .send({ species_id: speciesId })

      expect(res.status).toBe(401)
    })
  })

  describe("GET /plants", () => {
    it("should return empty array when no plants", async () => {
      const res = await request(app)
        .get("/plants")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("should return user plants with species info", async () => {
      await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId, nickname: "Planta 1" })

      await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId, nickname: "Planta 2" })

      const res = await request(app)
        .get("/plants")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
      expect(res.body[0]).toHaveProperty("species")
    })

    it("should not return plants from other users", async () => {
      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)
        .send({ species_id: speciesId })

      const res = await request(app)
        .get("/plants")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(0)
    })
  })

  describe("GET /plants/:id", () => {
    it("should return a plant by id", async () => {
      const created = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId, nickname: "Mi Monstera" })

      const res = await request(app)
        .get(`/plants/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.nickname).toBe("Mi Monstera")
    })

    it("should return 404 for non-existent plant", async () => {
      const res = await request(app)
        .get("/plants/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })

    it("should return 404 for plant belonging to another user", async () => {
      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherPlant = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)
        .send({ species_id: speciesId })

      const res = await request(app)
        .get(`/plants/${otherPlant.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe("PATCH /plants/:id", () => {
    it("should update plant nickname", async () => {
      const created = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId, nickname: "Viejo nombre" })

      const res = await request(app)
        .patch(`/plants/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ nickname: "Nuevo nombre" })

      expect(res.status).toBe(200)
      expect(res.body.nickname).toBe("Nuevo nombre")
    })

    it("should update health_status", async () => {
      const created = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId })

      const res = await request(app)
        .patch(`/plants/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ health_status: "excellent" })

      expect(res.status).toBe(200)
      expect(res.body.health_status).toBe("excellent")
    })

    it("should update last_watered_at", async () => {
      const created = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId })

      const now = new Date().toISOString()

      const res = await request(app)
        .patch(`/plants/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ last_watered_at: now })

      expect(res.status).toBe(200)
      expect(res.body.last_watered_at).toBeDefined()
    })

    it("should return 422 with invalid health_status", async () => {
      const created = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId })

      const res = await request(app)
        .patch(`/plants/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ health_status: "dead" })

      expect(res.status).toBe(422)
    })

    it("should return 404 for non-existent plant", async () => {
      const res = await request(app)
        .patch("/plants/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ nickname: "No existe" })

      expect(res.status).toBe(404)
    })
  })

  describe("DELETE /plants/:id", () => {
    it("should soft delete a plant", async () => {
      const created = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId })

      const res = await request(app)
        .delete(`/plants/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(204)
    })

    it("should not return deleted plant in list", async () => {
      const created = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId })

      await request(app)
        .delete(`/plants/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      const res = await request(app)
        .get("/plants")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.body).toHaveLength(0)
    })

    it("should return 404 for already deleted plant", async () => {
      const created = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: speciesId })

      await request(app)
        .delete(`/plants/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      const res = await request(app)
        .delete(`/plants/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })

    it("should return 404 for non-existent plant", async () => {
      const res = await request(app)
        .delete("/plants/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })
  })
})