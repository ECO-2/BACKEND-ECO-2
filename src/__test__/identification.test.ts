import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"

describe("Plant Identification", () => {
  let accessToken: string
  let speciesId: string

  beforeEach(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    const login = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "secret123" })

    accessToken = login.body.accessToken

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

  describe("POST /identifications", () => {
    it("should identify a plant with high confidence and match species", async () => {
      const res = await request(app)
        .post("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          scientific_name: "Monstera_deliciosa",
          confidence_score: 0.91
        })

      expect(res.status).toBe(201)
      expect(res.body.species.scientific_name).toBe("Monstera deliciosa")
      expect(res.body.low_confidence).toBe(false)
      expect(res.body.suggest_fallback).toBe(false)
      expect(res.body.identification.source).toBe("tflite")
    })

    it("should normalize underscores to spaces when matching species", async () => {
      const res = await request(app)
        .post("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          scientific_name: "Monstera_deliciosa",
          confidence_score: 0.85
        })

      expect(res.status).toBe(201)
      expect(res.body.species).not.toBeNull()
    })

    it("should flag low confidence results", async () => {
      const res = await request(app)
        .post("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          scientific_name: "Monstera_deliciosa",
          confidence_score: 0.45
        })

      expect(res.status).toBe(201)
      expect(res.body.low_confidence).toBe(true)
      expect(res.body.suggest_fallback).toBe(true)
    })

    it("should handle species not found in catalog", async () => {
      const res = await request(app)
        .post("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          scientific_name: "Especie_inexistente",
          confidence_score: 0.88
        })

      expect(res.status).toBe(201)
      expect(res.body.species).toBeNull()
      expect(res.body.suggest_fallback).toBe(true)
      expect(res.body.identification.identified_species_id).toBeNull()
    })

    it("should save identification even when species is not found", async () => {
      await request(app)
        .post("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          scientific_name: "Especie_inexistente",
          confidence_score: 0.5
        })

      const res = await request(app)
        .get("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.body).toHaveLength(1)
    })

    it("should return 422 with missing scientific_name", async () => {
      const res = await request(app)
        .post("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ confidence_score: 0.8 })

      expect(res.status).toBe(422)
    })

    it("should return 422 with confidence_score out of range", async () => {
      const res = await request(app)
        .post("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          scientific_name: "Monstera_deliciosa",
          confidence_score: 1.5
        })

      expect(res.status).toBe(422)
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .post("/identifications")
        .send({
          scientific_name: "Monstera_deliciosa",
          confidence_score: 0.9
        })

      expect(res.status).toBe(401)
    })
  })

  describe("GET /identifications", () => {
    it("should return empty array when no identifications yet", async () => {
      const res = await request(app)
        .get("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("should return identification history ordered by created_at desc", async () => {
      await request(app)
        .post("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ scientific_name: "Monstera_deliciosa", confidence_score: 0.9 })

      await request(app)
        .post("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ scientific_name: "Monstera_deliciosa", confidence_score: 0.6 })

      const res = await request(app)
        .get("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
      expect(res.body[0]).toHaveProperty("species")
    })

    it("should not return identifications from other users", async () => {
      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      await request(app)
        .post("/identifications")
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)
        .send({ scientific_name: "Monstera_deliciosa", confidence_score: 0.9 })

      const res = await request(app)
        .get("/identifications")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(0)
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/identifications")
      expect(res.status).toBe(401)
    })
  })
})