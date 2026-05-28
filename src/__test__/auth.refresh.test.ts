import request from "supertest"
import app from "@/app"

describe("POST /auth/refresh", () => {
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

  it("should return new tokens", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("accessToken")
    expect(res.body).toHaveProperty("refreshToken")
  })

  it("should rotate the refresh token", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken })

    expect(res.body.refreshToken).not.toBe(refreshToken)
  })

  it("should reject the old refresh token after rotation", async () => {
    await request(app)
      .post("/auth/refresh")
      .send({ refreshToken })

    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken })

    expect(res.status).toBe(401)
  })

  it("should return 401 with invalid token", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: "tokenbasura" })

    expect(res.status).toBe(401)
  })
})