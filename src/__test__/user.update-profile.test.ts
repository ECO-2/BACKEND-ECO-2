import request from "supertest"
import app from "@/app"

describe("PATCH /user/profile", () => {
  let accessToken: string

  beforeEach(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "secret123" })

    accessToken = res.body.accessToken
  })

  it("should update username successfully", async () => {
    const res = await request(app)
      .patch("/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ username: "nuevo_nombre" })

    expect(res.status).toBe(200)
    expect(res.body.username).toBe("nuevo_nombre")
  })

  it("should update notification preferences", async () => {
    const res = await request(app)
      .patch("/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ notifications_enabled: false })

    expect(res.status).toBe(200)
    expect(res.body.notifications_enabled).toBe(false)
  })

  it("should update reminder hours", async () => {
    const res = await request(app)
      .patch("/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ reminder_start_hour: 9, reminder_end_hour: 20 })

    expect(res.status).toBe(200)
    expect(res.body.reminder_start_hour).toBe(9)
    expect(res.body.reminder_end_hour).toBe(20)
  })

  it("should update multiple fields at once", async () => {
    const res = await request(app)
      .patch("/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        username: "multi_update",
        notifications_enabled: true,
        reminder_start_hour: 7,
        reminder_end_hour: 22
      })

    expect(res.status).toBe(200)
    expect(res.body.username).toBe("multi_update")
    expect(res.body.notifications_enabled).toBe(true)
    expect(res.body.reminder_start_hour).toBe(7)
    expect(res.body.reminder_end_hour).toBe(22)
  })

  it("should return 401 without authentication", async () => {
    const res = await request(app)
      .patch("/user/profile")
      .send({ username: "sin_auth" })

    expect(res.status).toBe(401)
  })

  it("should return 409 if username is already taken", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "other@eco2.com", password: "secret123" })

    const otherLogin = await request(app)
      .post("/auth/login")
      .send({ email: "other@eco2.com", password: "secret123" })

    await request(app)
      .patch("/user/profile")
      .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)
      .send({ username: "nombre_tomado" })

    const res = await request(app)
      .patch("/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ username: "nombre_tomado" })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe("Username already taken")
  })

  it("should return 422 if username is too short", async () => {
    const res = await request(app)
      .patch("/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ username: "ab" })

    expect(res.status).toBe(422)
  })

  it("should return 422 if reminder_start_hour is after reminder_end_hour", async () => {
    const res = await request(app)
      .patch("/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ reminder_start_hour: 20, reminder_end_hour: 8 })

    expect(res.status).toBe(422)
  })

  it("should return 422 if reminder hour is out of range", async () => {
    const res = await request(app)
      .patch("/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ reminder_start_hour: 3 })

    expect(res.status).toBe(422)
  })

  it("should allow empty body without error", async () => {
    const res = await request(app)
      .patch("/user/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({})

    expect(res.status).toBe(200)
  })
})