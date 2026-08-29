import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex")

describe("Password Reset Flow", () => {
  beforeEach(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })
  })

  describe("POST /auth/forgot-password", () => {
    it("should return 200 and set a reset_token_hash for an existing user", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "test@eco2.com" })

      expect(res.status).toBe(200)

      const user = await prisma.user.findUnique({ where: { email: "test@eco2.com" } })
      expect(user?.reset_token_hash).not.toBeNull()
    })

    it("should return 200 even if the email does not exist (no enumeration)", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "doesnotexist@eco2.com" })

      expect(res.status).toBe(200)
    })

    it("should return 422 with an invalid email", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "no-es-email" })

      expect(res.status).toBe(422)
    })
  })

  describe("POST /auth/reset-password", () => {
    it("should reset the password with a valid token", async () => {
      const rawToken = `${Date.now()}.${crypto.randomBytes(32).toString("hex")}`
      await prisma.user.update({
        where: { email: "test@eco2.com" },
        data: { reset_token_hash: hashToken(rawToken) }
      })

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: rawToken, new_password: "newpass456" })

      expect(res.status).toBe(200)

      const login = await request(app)
        .post("/auth/login")
        .send({ email: "test@eco2.com", password: "newpass456" })
      expect(login.status).toBe(200)
    })

    it("should clear the reset_token_hash after use (single use)", async () => {
      const rawToken = `${Date.now()}.${crypto.randomBytes(32).toString("hex")}`
      await prisma.user.update({
        where: { email: "test@eco2.com" },
        data: { reset_token_hash: hashToken(rawToken) }
      })

      await request(app)
        .post("/auth/reset-password")
        .send({ token: rawToken, new_password: "newpass456" })

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: rawToken, new_password: "anotherpass789" })

      expect(res.status).toBe(400)
    })

    it("should return 400 with an expired token", async () => {
      const expiredTimestamp = Date.now() - 31 * 60 * 1000 // 31 minutos atrás
      const rawToken = `${expiredTimestamp}.${crypto.randomBytes(32).toString("hex")}`
      await prisma.user.update({
        where: { email: "test@eco2.com" },
        data: { reset_token_hash: hashToken(rawToken) }
      })

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: rawToken, new_password: "newpass456" })

      expect(res.status).toBe(400)
    })

    it("should return 400 with an invalid token", async () => {
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "invalid.token", new_password: "newpass456" })

      expect(res.status).toBe(400)
    })

    it("should return 422 with a short new_password", async () => {
      const rawToken = `${Date.now()}.${crypto.randomBytes(32).toString("hex")}`
      await prisma.user.update({
        where: { email: "test@eco2.com" },
        data: { reset_token_hash: hashToken(rawToken) }
      })

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: rawToken, new_password: "123" })

      expect(res.status).toBe(422)
    })
  })
})