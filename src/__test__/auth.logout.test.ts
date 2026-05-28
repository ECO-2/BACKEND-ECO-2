import request from "supertest"
import app from "@/app"

describe("POST /auth/logout", () => {
  let refreshToken: string

  beforeEach(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "secret123" })

    refreshToken = res.body.refreshToken
  })

  it("should logout successfully", async () => {
    const res = await request(app)
      .post("/auth/logout")
      .send({ refreshToken })

    expect(res.status).toBe(204)
  })

  it("should reject refresh after logout", async () => {
    await request(app)
      .post("/auth/logout")
      .send({ refreshToken })

    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken })

    expect(res.status).toBe(401)
  })
})