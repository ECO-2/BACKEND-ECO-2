import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"
import { FREE_MAX_PLANTS } from "@/domain/plans/limits"

describe("Canje de artículos de la tienda", () => {
  let accessToken: string
  let userId: string

  const giveSeeds = async (amount: number) => {
    await prisma.userProgress.upsert({
      where: { user_id: userId },
      create: { user_id: userId, seeds: amount },
      update: { seeds: amount }
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
  })

  const auth = (r: request.Test) => r.set("Authorization", `Bearer ${accessToken}`)
  const redeem = (itemId: string) =>
    auth(request(app).post("/user/store/redeem").send({ item_id: itemId }))

  it("O2+ de 2 semanas activa el plan y cobra", async () => {
    await giveSeeds(5000)

    const res = await redeem("o2_plus_2w")

    expect(res.status).toBe(200)
    expect(res.body.seeds).toBe(5000 - res.body.cost)
    // Este es el fallo que se reporto: cobraba y dejaba el plan en gratuito.
    expect(res.body.plan.is_plus_active).toBe(true)
    expect(res.body.plan.plants_limit).toBeNull()
    expect(res.body.plan.scans_limit).toBeNull()

    const user = await prisma.user.findUnique({ where: { id: userId } })
    const days = Math.round(
      (user!.plan_expires_at!.getTime() - Date.now()) / 86400000
    )
    expect(days).toBe(14)
  })

  it("comprar O2+ dos veces suma el tiempo, no lo recorta", async () => {
    await giveSeeds(20000)
    await redeem("o2_plus_2w")
    const first = await prisma.user.findUnique({ where: { id: userId } })
    await redeem("o2_plus_2w")
    const second = await prisma.user.findUnique({ where: { id: userId } })

    expect(second!.plan_expires_at!.getTime())
      .toBeGreaterThan(first!.plan_expires_at!.getTime())
  })

  it("el pack de 3 macetas sube el tope permanentemente", async () => {
    await giveSeeds(5000)

    const res = await redeem("maceta_pack3")

    expect(res.status).toBe(200)
    expect(res.body.plan.plants_limit).toBe(FREE_MAX_PLANTS + 3)
  })

  it("el alquiler sube el tope y caduca", async () => {
    await giveSeeds(5000)

    const res = await redeem("maceta_rental_2w")
    expect(res.body.plan.plants_limit).toBe(FREE_MAX_PLANTS + 1)

    // Se retrocede el vencimiento: la maceta alquilada deja de contar.
    await prisma.user.update({
      where: { id: userId },
      data: { rental_slots_expires_at: new Date(Date.now() - 1000) }
    })

    const after = await auth(request(app).get("/user/plan"))
    expect(after.body.plants_limit).toBe(FREE_MAX_PLANTS)
  })

  it("el plan informa del alquiler mientras dura, para poder avisar", async () => {
    await giveSeeds(5000)
    await redeem("maceta_rental_2w")

    const plan = await auth(request(app).get("/user/plan"))

    // Sin estos dos campos la app no puede decirle al usuario que tiene una
    // maceta alquilada ni cuando vence: se enteraba al quedarse sin sitio.
    expect(plan.body.rental_pots).toBe(1)
    const days = Math.round(
      (new Date(plan.body.rental_expires_at).getTime() - Date.now()) / 86400000
    )
    expect(days).toBe(14)
  })

  it("un alquiler vencido deja de contar como maceta activa", async () => {
    await giveSeeds(5000)
    await redeem("maceta_rental_2w")
    await prisma.user.update({
      where: { id: userId },
      data: { rental_slots_expires_at: new Date(Date.now() - 1000) }
    })

    const plan = await auth(request(app).get("/user/plan"))

    expect(plan.body.rental_pots).toBe(0)
    expect(plan.body.plants_limit).toBe(FREE_MAX_PLANTS)
  })

  it("rechaza el canje sin semillas suficientes y no entrega nada", async () => {
    await giveSeeds(10)

    const res = await redeem("o2_plus_2w")

    expect(res.status).toBe(402)
    expect(res.body.error).toBe("not_enough_seeds")

    const progress = await prisma.userProgress.findUnique({ where: { user_id: userId } })
    expect(progress!.seeds).toBe(10)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    expect(user!.plan_type).toBe("free")
  })

  it("rechaza un artículo que no existe", async () => {
    await giveSeeds(5000)
    const res = await redeem("articulo_inventado")
    expect(res.status).toBe(404)

    // Y no cobra: un id desconocido no debe descontar semillas.
    const progress = await prisma.userProgress.findUnique({ where: { user_id: userId } })
    expect(progress!.seeds).toBe(5000)
  })
})
