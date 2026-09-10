import request from "supertest"
import app from "@/app"

describe("PATCH /user/password", () => {
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

  it("should update the password successfully", async () => {
    const res = await request(app)
      .patch("/user/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ current_password: "secret123", new_password: "newpass456" })

    expect(res.status).toBe(204)

    const loginWithOld = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "secret123" })
    expect(loginWithOld.status).toBe(401)

    const loginWithNew = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "newpass456" })
    expect(loginWithNew.status).toBe(200)
  })

  it("should return 401 when current_password is incorrect", async () => {
    const res = await request(app)
      .patch("/user/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ current_password: "wrongpassword", new_password: "newpass456" })

    expect(res.status).toBe(401)
  })

  it("should return 422 when new_password is too short", async () => {
    const res = await request(app)
      .patch("/user/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ current_password: "secret123", new_password: "123" })

    expect(res.status).toBe(422)
  })

  it("should return 422 with missing fields", async () => {
    const res = await request(app)
      .patch("/user/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ current_password: "secret123" })

    expect(res.status).toBe(422)
  })

  it("should return 401 without authentication", async () => {
    const res = await request(app)
      .patch("/user/password")
      .send({ current_password: "secret123", new_password: "newpass456" })

    expect(res.status).toBe(401)
  })
})