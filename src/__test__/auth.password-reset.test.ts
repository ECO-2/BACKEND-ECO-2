import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"
import { packResetToken, RESET_CODE_TTL_MS } from "@/utils/reset-code"

// El envío real se cubre aparte; aquí interesa el flujo, no Resend.
jest.mock("@/infrastructure/services/password-reset-email.service", () => ({
  sendPasswordResetCode: jest.fn().mockResolvedValue(true)
}))

import { sendPasswordResetCode } from "@/infrastructure/services/password-reset-email.service"

const seedCode = async (code: string, issuedAt = Date.now()) => {
  await prisma.user.update({
    where: { email: "test@eco2.com" },
    data: { reset_token_hash: packResetToken(code, issuedAt) }
  })
}

describe("Password Reset Flow", () => {
  beforeEach(async () => {
    jest.clearAllMocks()
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

    it("should email the code to an existing user", async () => {
      await request(app)
        .post("/auth/forgot-password")
        .send({ email: "test@eco2.com" })

      expect(sendPasswordResetCode).toHaveBeenCalledTimes(1)
      const [to, code] = (sendPasswordResetCode as jest.Mock).mock.calls[0]
      expect(to).toBe("test@eco2.com")
      // Formato pegable: 4 caracteres, guion, 4 caracteres.
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    })

    it("should not email anything when the address is not registered", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "doesnotexist@eco2.com" })

      // Misma respuesta que para un correo real, para no filtrar registros.
      expect(res.status).toBe(200)
      expect(sendPasswordResetCode).not.toHaveBeenCalled()
    })

    it("should return 422 with an invalid email", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "no-es-email" })

      expect(res.status).toBe(422)
    })
  })

  describe("POST /auth/reset-password", () => {
    it("should reset the password with a valid code", async () => {
      await seedCode("ABCD-2345")

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "ABCD-2345", new_password: "newpass456" })

      expect(res.status).toBe(200)

      const login = await request(app)
        .post("/auth/login")
        .send({ email: "test@eco2.com", password: "newpass456" })
      expect(login.status).toBe(200)
    })

    it("should accept the code however it was pasted", async () => {
      await seedCode("ABCD-2345")

      // Sin guion y en minúsculas: es lo que pasa al copiar del correo a mano.
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: " abcd2345 ", new_password: "newpass456" })

      expect(res.status).toBe(200)
    })

    it("should clear the code after use (single use)", async () => {
      await seedCode("ABCD-2345")

      await request(app)
        .post("/auth/reset-password")
        .send({ token: "ABCD-2345", new_password: "newpass456" })

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "ABCD-2345", new_password: "anotherpass789" })

      expect(res.status).toBe(400)
    })

    it("should return 400 with an expired code", async () => {
      // Emitido justo antes de que venciera la ventana.
      await seedCode("ABCD-2345", Date.now() - RESET_CODE_TTL_MS - 1000)

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "ABCD-2345", new_password: "newpass456" })

      expect(res.status).toBe(400)
    })

    it("should return 400 with an unknown code", async () => {
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "ZZZZ-9999", new_password: "newpass456" })

      expect(res.status).toBe(400)
    })

    it("should return 422 with a short new_password", async () => {
      await seedCode("ABCD-2345")

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "ABCD-2345", new_password: "123" })

      expect(res.status).toBe(422)
    })
  })
})
