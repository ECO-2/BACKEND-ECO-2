import request from "supertest"
import app from "@/app"

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })
  })

  it("should login successfully and return tokens", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "secret123" })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("accessToken")
    expect(res.body).toHaveProperty("refreshToken")
  })

  it("should return 401 with wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "wrongpassword" })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty("error", "Invalid credentials")
  })

  it("should return 401 with non-existent user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "noexiste@eco2.com", password: "secret123" })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty("error", "Invalid credentials")
  })

  it("should return same error message for wrong password and non-existent user", async () => {
    const wrongPassword = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "wrong" })

    const noUser = await request(app)
      .post("/auth/login")
      .send({ email: "noexiste@eco2.com", password: "secret123" })

    expect(wrongPassword.body.error).toBe(noUser.body.error)
  })
})