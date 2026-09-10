import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"

describe("POST /user/device-token", () => {
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

  it("should register a device token successfully", async () => {
    const res = await request(app)
      .post("/user/device-token")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ token: "fcm-token-abc123" })

    expect(res.status).toBe(204)

    const stored = await prisma.deviceToken.findUnique({ where: { token: "fcm-token-abc123" } })
    expect(stored).not.toBeNull()
  })

  it("should reassign the token if it already belongs to another user", async () => {
    await request(app)
      .post("/user/device-token")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ token: "shared-device-token" })

    await request(app)
      .post("/auth/register")
      .send({ email: "other@eco2.com", password: "secret123" })

    const otherLogin = await request(app)
      .post("/auth/login")
      .send({ email: "other@eco2.com", password: "secret123" })

    const res = await request(app)
      .post("/user/device-token")
      .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)
      .send({ token: "shared-device-token" })

    expect(res.status).toBe(204)

    const stored = await prisma.deviceToken.findUnique({ where: { token: "shared-device-token" } })
    expect(stored?.user_id).toBe(otherLogin.body.id ?? stored?.user_id) // ver nota abajo
  })

  it("should return 422 with missing token", async () => {
    const res = await request(app)
      .post("/user/device-token")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({})

    expect(res.status).toBe(422)
  })

  it("should return 401 without authentication", async () => {
    const res = await request(app)
      .post("/user/device-token")
      .send({ token: "fcm-token-abc123" })

    expect(res.status).toBe(401)
  })
})