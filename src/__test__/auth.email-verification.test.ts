import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"
import { generateVerifyToken, packVerifyToken } from "@/utils/email-verification-token"

// El envío real se cubre aparte; aquí interesa el flujo, no Resend.
jest.mock("@/infrastructure/services/verification-email.service", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true)
}))

import { sendVerificationEmail } from "@/infrastructure/services/verification-email.service"

const seedToken = async (token: string, issuedAt = Date.now()) => {
  await prisma.user.update({
    where: { email: "test@eco2.com" },
    data: { email_verify_token_hash: packVerifyToken(token, issuedAt) }
  })
}

describe("Email Verification Flow", () => {
  let accessToken: string
  let speciesId: string

  beforeEach(async () => {
    jest.clearAllMocks()

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

  const scan = () =>
    request(app)
      .post("/identifications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ scientific_name: "Monstera deliciosa", confidence_score: 0.9 })

  describe("POST /auth/register", () => {
    it("should send a verification email on signup", async () => {
      // El registro ya ocurrió en beforeEach; solo confirmamos que se llamó.
      expect(sendVerificationEmail).toHaveBeenCalledTimes(1)
      const [to] = (sendVerificationEmail as jest.Mock).mock.calls[0]
      expect(to).toBe("test@eco2.com")
    })

    it("should create a user with email_verified false", async () => {
      const user = await prisma.user.findUnique({ where: { email: "test@eco2.com" } })
      expect(user?.email_verified).toBe(false)
    })
  })

  describe("GET /auth/verify-email", () => {
    it("should verify the email with a valid token", async () => {
      const token = generateVerifyToken()
      await seedToken(token)

      const res = await request(app).get(`/auth/verify-email?token=${token}`)

      expect(res.status).toBe(200)
      expect(res.text).toContain("Correo verificado")

      const user = await prisma.user.findUnique({ where: { email: "test@eco2.com" } })
      expect(user?.email_verified).toBe(true)
    })

    it("should award 10 seeds on verification", async () => {
      const token = generateVerifyToken()
      await seedToken(token)

      await request(app).get(`/auth/verify-email?token=${token}`)

      const progress = await request(app)
        .get("/gamification/progress")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(progress.body.seeds).toBe(10)
    })

    it("should say already verified on second click without awarding seeds again", async () => {
      const token = generateVerifyToken()
      await seedToken(token)

      await request(app).get(`/auth/verify-email?token=${token}`)
      const second = await request(app).get(`/auth/verify-email?token=${token}`)

      expect(second.status).toBe(200)
      expect(second.text).toContain("ya estaba verificado")

      const progress = await request(app)
        .get("/gamification/progress")
        .set("Authorization", `Bearer ${accessToken}`)
      expect(progress.body.seeds).toBe(10) // no se duplicó
    })

    it("should return 400 with an expired token", async () => {
      const token = generateVerifyToken()
      const expiredIssuedAt = Date.now() - 25 * 60 * 60 * 1000 // 25h atrás, TTL es 24h
      await seedToken(token, expiredIssuedAt)

      const res = await request(app).get(`/auth/verify-email?token=${token}`)

      expect(res.status).toBe(400)
      expect(res.text).toContain("no es válido o ya expiró")
    })

    it("should return 400 with an unknown token", async () => {
      const res = await request(app).get("/auth/verify-email?token=unknown-token-value")

      expect(res.status).toBe(400)
    })

    it("should return 400 with a missing token", async () => {
      const res = await request(app).get("/auth/verify-email")

      expect(res.status).toBe(400)
    })
  })

  describe("Scan limit for unverified users", () => {
    it("should allow only 1 scan per day when not verified", async () => {
      const first = await scan()
      expect(first.status).toBe(201)

      const second = await scan()
      expect(second.status).toBe(403)
      expect(second.body.error).toBe("scan_limit_reached")
    })

    it("should allow the normal daily limit once verified", async () => {
      const token = generateVerifyToken()
      await seedToken(token)
      await request(app).get(`/auth/verify-email?token=${token}`)

      for (let i = 0; i < 5; i++) {
        const res = await scan()
        expect(res.status).toBe(201)
      }

      const extra = await scan()
      expect(extra.status).toBe(403)
    })
  })
})