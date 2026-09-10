import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"

describe("Avatares", () => {
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

  describe("GET /user/avatars", () => {
    it("marca como propios los gratuitos y no los de pago", async () => {
      const res = await auth(request(app).get("/user/avatars"))

      expect(res.status).toBe(200)
      const byId = Object.fromEntries(res.body.avatars.map((a: any) => [a.id, a]))

      expect(byId["agronoma"].free).toBe(true)
      expect(byId["agronoma"].owned).toBe(true)
      expect(byId["jardinera"].free).toBe(false)
      expect(byId["jardinera"].owned).toBe(false)
      expect(byId["jardinera"].cost).toBeGreaterThan(0)
    })
  })

  describe("POST /user/avatars/purchase", () => {
    it("descuenta las semillas y entrega el avatar", async () => {
      await giveSeeds(1000)

      const res = await auth(
        request(app).post("/user/avatars/purchase").send({ avatar_id: "jardinera" })
      )

      expect(res.status).toBe(200)
      expect(res.body.avatar_id).toBe("jardinera")
      expect(res.body.seeds).toBe(1000 - res.body.cost)

      const owned = await prisma.userAvatar.findMany({ where: { user_id: userId } })
      expect(owned.map(o => o.avatar_id)).toContain("jardinera")

      // Queda constancia del gasto, como con cualquier otra compra.
      const tx = await prisma.seedTransaction.findMany({ where: { user_id: userId } })
      expect(tx.some(t => t.reason === "avatar:jardinera" && t.amount < 0)).toBe(true)
    })

    it("rechaza la compra si no alcanzan las semillas y no cobra nada", async () => {
      await giveSeeds(10)

      const res = await auth(
        request(app).post("/user/avatars/purchase").send({ avatar_id: "noctilana" })
      )

      expect(res.status).toBe(402)
      expect(res.body.error).toBe("not_enough_seeds")

      const progress = await prisma.userProgress.findUnique({ where: { user_id: userId } })
      expect(progress!.seeds).toBe(10)
      const owned = await prisma.userAvatar.findMany({ where: { user_id: userId } })
      expect(owned).toHaveLength(0)
    })

    it("no cobra dos veces el mismo avatar", async () => {
      await giveSeeds(2000)
      await auth(request(app).post("/user/avatars/purchase").send({ avatar_id: "explorador" }))
      const afterFirst = await prisma.userProgress.findUnique({ where: { user_id: userId } })

      const res = await auth(
        request(app).post("/user/avatars/purchase").send({ avatar_id: "explorador" })
      )

      expect(res.status).toBe(409)
      const afterSecond = await prisma.userProgress.findUnique({ where: { user_id: userId } })
      expect(afterSecond!.seeds).toBe(afterFirst!.seeds)
    })

    it("rechaza comprar uno gratuito", async () => {
      await giveSeeds(1000)
      const res = await auth(
        request(app).post("/user/avatars/purchase").send({ avatar_id: "agronoma" })
      )
      expect(res.status).toBe(400)
      expect(res.body.error).toBe("avatar_is_free")
    })

    it("rechaza un avatar que no existe", async () => {
      const res = await auth(
        request(app).post("/user/avatars/purchase").send({ avatar_id: "inventado" })
      )
      expect(res.status).toBe(404)
    })
  })

  describe("PATCH /user/profile — avatar", () => {
    it("acepta un avatar gratuito", async () => {
      const res = await auth(
        request(app).patch("/user/profile").send({ avatar_url: "granjero" })
      )
      expect(res.status).toBe(200)
      expect(res.body.avatar_url).toBe("granjero")
    })

    it("rechaza uno de pago que no se ha comprado", async () => {
      // El punto del test: la validacion de formato del esquema deja pasar la
      // cadena, asi que sin comprobar la propiedad se podria poner gratis.
      const res = await auth(
        request(app).patch("/user/profile").send({ avatar_url: "criadora" })
      )
      expect(res.status).toBe(403)
      expect(res.body.error).toBe("avatar_not_owned")
    })

    it("acepta uno de pago despues de comprarlo", async () => {
      await giveSeeds(1000)
      await auth(request(app).post("/user/avatars/purchase").send({ avatar_id: "criadora" }))

      const res = await auth(
        request(app).patch("/user/profile").send({ avatar_url: "criadora" })
      )
      expect(res.status).toBe(200)
      expect(res.body.avatar_url).toBe("criadora")
    })
  })
})
