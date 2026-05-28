import request from "supertest"
import app from "@/app"

describe("POST /auth/register", () => {
  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty("id")
    expect(res.body).toHaveProperty("email", "test@eco2.com")
  })

  it("should return 409 if user already exists", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    expect(res.status).toBe(409)
    expect(res.body).toHaveProperty("error", "User already exists")
  })

  it("should return 422 with invalid data", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "no-es-email", password: "123" })

    expect(res.status).toBe(422)
    expect(res.body).toHaveProperty("details")
  })
})