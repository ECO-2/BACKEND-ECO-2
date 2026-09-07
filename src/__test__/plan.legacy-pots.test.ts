import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"
import { FREE_MAX_PLANTS, LEGACY_POT_CAP } from "@/domain/plans/limits"

/**
 * Aterrizaje suave al caducar O2+.
 *
 * Lo que se comprueba aquí es sobre todo lo que **no** debe pasar: que a nadie
 * se le borren ni se le oculten plantas cuando se le acaba la suscripción.
 */
describe("Macetas heredadas al caducar O2+", () => {
  let accessToken: string
  let userId: string
  let speciesId: string

  const auth = (r: request.Test) => r.set("Authorization", `Bearer ${accessToken}`)
  const getPlan = () => auth(request(app).get("/user/plan"))

  /** Deja al usuario con O2+ ya caducado y `n` plantas vivas. */
  const expiredPlusWith = async (n: number) => {
    for (let i = 0; i < n; i++) {
      await prisma.userPlant.create({
        data: { user_id: userId, species_id: speciesId, nickname: `P${i}` }
      })
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan_type: "plus",
        plan_expires_at: new Date(Date.now() - 60_000),
        plus_settled_at: null,
        legacy_plant_slots: 0
      }
    })
  }

  beforeEach(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })
    const login = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "secret123" })
    accessToken = login.body.accessToken
    const user = await prisma.user.findUnique({ where: { email: "test@eco2.com" } })
    userId = user!.id
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

  it("no borra ninguna planta al caducar la suscripción", async () => {
    await expiredPlusWith(FREE_MAX_PLANTS + 8)

    const plan = await getPlan()

    expect(plan.body.is_plus_active).toBe(false)
    // Las 18 siguen ahí y siguen contándose como suyas.
    expect(plan.body.plants_used).toBe(FREE_MAX_PLANTS + 8)
    const alive = await prisma.userPlant.count({
      where: { user_id: userId, deleted_at: null }
    })
    expect(alive).toBe(FREE_MAX_PLANTS + 8)
  })

  it("conserva hasta el tope de macetas heredadas", async () => {
    await expiredPlusWith(FREE_MAX_PLANTS + 8)

    const plan = await getPlan()

    // 8 por encima del plan gratuito, pero solo se heredan LEGACY_POT_CAP.
    expect(plan.body.legacy_pots).toBe(LEGACY_POT_CAP)
    expect(plan.body.plants_limit).toBe(FREE_MAX_PLANTS + LEGACY_POT_CAP)
  })

  it("hereda solo lo que sobrepasaba el plan gratuito", async () => {
    await expiredPlusWith(FREE_MAX_PLANTS + 2)

    const plan = await getPlan()

    expect(plan.body.legacy_pots).toBe(2)
    expect(plan.body.plants_limit).toBe(FREE_MAX_PLANTS + 2)
  })

  it("no hereda nada si nunca pasó del tope gratuito", async () => {
    await expiredPlusWith(3)

    const plan = await getPlan()

    expect(plan.body.legacy_pots).toBe(0)
    expect(plan.body.plants_limit).toBe(FREE_MAX_PLANTS)
  })

  it("liquida una sola vez: borrar plantas después no quita lo heredado", async () => {
    await expiredPlusWith(FREE_MAX_PLANTS + 3)
    await getPlan()

    // El usuario se deshace de casi todas. Lo ya concedido no se le retira,
    // porque si no bastaría con volver a consultar el plan para perderlo.
    await prisma.userPlant.updateMany({
      where: { user_id: userId },
      data: { deleted_at: new Date() }
    })

    const plan = await getPlan()
    expect(plan.body.legacy_pots).toBe(3)
    expect(plan.body.plants_limit).toBe(FREE_MAX_PLANTS + 3)
  })

  it("con O2+ vigente no liquida ni limita", async () => {
    await expiredPlusWith(FREE_MAX_PLANTS + 4)
    await prisma.user.update({
      where: { id: userId },
      data: { plan_expires_at: new Date(Date.now() + 86_400_000) }
    })

    const plan = await getPlan()

    expect(plan.body.is_plus_active).toBe(true)
    expect(plan.body.plants_limit).toBeNull()
    expect(plan.body.legacy_pots).toBe(0)
  })

  it("el tope solo impide añadir, y deja añadir en cuanto hay hueco", async () => {
    await expiredPlusWith(FREE_MAX_PLANTS + 8)
    await getPlan()

    // Con 18 plantas y tope 15 no puede añadir.
    const blocked = await auth(
      request(app).post("/plants").send({ species_id: speciesId })
    )
    expect(blocked.status).toBe(403)
    expect(blocked.body.error ?? blocked.body.message).toContain("plant_limit_reached")

    // Baja a 14 y vuelve a poder.
    const extra = await prisma.userPlant.findMany({
      where: { user_id: userId, deleted_at: null },
      take: 4,
      select: { id: true }
    })
    await prisma.userPlant.updateMany({
      where: { id: { in: extra.map(p => p.id) } },
      data: { deleted_at: new Date() }
    })

    const allowed = await auth(
      request(app).post("/plants").send({ species_id: speciesId })
    )
    expect(allowed.status).toBeLessThan(300)
  })
})
