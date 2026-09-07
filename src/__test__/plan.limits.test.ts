import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"
import { FREE_DAILY_SCANS, FREE_MAX_PLANTS } from "@/domain/plans/limits"

describe("Límites del plan gratuito y O2+", () => {
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

  const addPlant = () =>
    request(app)
      .post("/plants")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ species_id: speciesId, nickname: "Planta" })

  const scan = () =>
    request(app)
      .post("/identifications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ scientific_name: "Monstera deliciosa", confidence_score: 0.9 })

  describe("GET /user/plan", () => {
    it("reporta el plan gratuito con sus topes", async () => {
      const res = await request(app)
        .get("/user/plan")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.is_plus_active).toBe(false)
      expect(res.body.plants_limit).toBe(FREE_MAX_PLANTS)
      expect(res.body.scans_limit).toBe(FREE_DAILY_SCANS)
      expect(res.body.plants_used).toBe(0)
      expect(res.body.scans_used_today).toBe(0)
    })
  })

  describe("Tope de plantas", () => {
    it(`permite ${FREE_MAX_PLANTS} y rechaza la siguiente`, async () => {
      for (let i = 0; i < FREE_MAX_PLANTS; i++) {
        const res = await addPlant()
        expect(res.status).toBe(201)
      }

      const extra = await addPlant()
      expect(extra.status).toBe(403)
      expect(extra.body.error).toBe("plant_limit_reached")
    })

    it("no cuenta las plantas eliminadas contra el tope", async () => {
      const first = await addPlant()
      for (let i = 1; i < FREE_MAX_PLANTS; i++) await addPlant()

      // Con el cupo lleno, borrar una debe liberar sitio.
      await request(app)
        .delete(`/plants/${first.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      const again = await addPlant()
      expect(again.status).toBe(201)
    })
  })

  describe("Tope de escaneos diarios", () => {
    it(`permite ${FREE_DAILY_SCANS} al día y rechaza el siguiente`, async () => {
      for (let i = 0; i < FREE_DAILY_SCANS; i++) {
        const res = await scan()
        expect(res.status).toBe(201)
      }

      const extra = await scan()
      expect(extra.status).toBe(403)
      expect(extra.body.error).toBe("scan_limit_reached")
    })
  })

  describe("O2+", () => {
    it("levanta ambos topes al activarse", async () => {
      const activate = await request(app)
        .post("/user/plan/activate")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ months: 12 })

      expect(activate.status).toBe(200)
      expect(activate.body.is_plus_active).toBe(true)
      expect(activate.body.plants_limit).toBeNull()
      expect(activate.body.scans_limit).toBeNull()
      // El cobro es simulado y el endpoint lo dice explícitamente.
      expect(activate.body.simulated).toBe(true)

      for (let i = 0; i < FREE_MAX_PLANTS + 2; i++) {
        expect((await addPlant()).status).toBe(201)
      }
      for (let i = 0; i < FREE_DAILY_SCANS + 2; i++) {
        expect((await scan()).status).toBe(201)
      }
    })

    it("no cuenta como activo si la suscripción ya venció", async () => {
      await request(app)
        .post("/user/plan/activate")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ months: 1 })

      // Se retrocede la fecha de fin: plan_type sigue en "plus", así que sin
      // mirar la fecha una suscripción caducada seria permanente.
      await prisma.user.update({
        where: { email: "test@eco2.com" },
        data: { plan_expires_at: new Date(Date.now() - 1000) }
      })

      const res = await request(app)
        .get("/user/plan")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.body.is_plus_active).toBe(false)
      expect(res.body.plants_limit).toBe(FREE_MAX_PLANTS)
    })

    it("suma al tiempo restante en vez de recortarlo al renovar", async () => {
      const first = await request(app)
        .post("/user/plan/activate")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ months: 1 })

      const second = await request(app)
        .post("/user/plan/activate")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ months: 1 })

      expect(new Date(second.body.plan_expires_at).getTime())
        .toBeGreaterThan(new Date(first.body.plan_expires_at).getTime())
    })

    it("vuelve al plan gratuito al cancelar", async () => {
      await request(app)
        .post("/user/plan/activate")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({})

      const res = await request(app)
        .post("/user/plan/cancel")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.is_plus_active).toBe(false)
      expect(res.body.plan_type).toBe("free")
    })
  })
})
