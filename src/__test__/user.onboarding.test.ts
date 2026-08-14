import request from "supertest"
import app from "@/app"

describe("PATCH /user/onboarding", () => {
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

  it("should complete onboarding successfully", async () => {
    const res = await request(app)
      .patch("/user/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        username: "planta_lover",
        gender: "prefer_not_to_say",
        birth_day: "1998-05-12"
      })

    expect(res.status).toBe(200)
    expect(res.body.username).toBe("planta_lover")
    expect(res.body.gender).toBe("prefer_not_to_say")
    expect(res.body.onboarding_completed).toBe(true)
  })

  it("should allow partial onboarding with only some fields", async () => {
    const res = await request(app)
      .patch("/user/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ username: "solo_username" })

    expect(res.status).toBe(200)
    expect(res.body.username).toBe("solo_username")
    expect(res.body.onboarding_completed).toBe(true)
  })

  it("should allow empty body and still mark onboarding as completed", async () => {
    const res = await request(app)
      .patch("/user/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.onboarding_completed).toBe(true)
  })

  it("should reject request without authentication", async () => {
    const res = await request(app)
      .patch("/user/onboarding")
      .send({ username: "no_auth" })

    expect(res.status).toBe(401)
  })

  it("should return 409 if username is already taken by another user", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "other@eco2.com", password: "secret123" })

    const otherLogin = await request(app)
      .post("/auth/login")
      .send({ email: "other@eco2.com", password: "secret123" })

    await request(app)
      .patch("/user/onboarding")
      .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)
      .send({ username: "taken_username" })

    const res = await request(app)
      .patch("/user/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ username: "taken_username" })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe("Username already taken")
  })

  it("should return 422 with invalid gender value", async () => {
    const res = await request(app)
      .patch("/user/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ gender: "not_a_valid_gender" })

    expect(res.status).toBe(422)
  })

  it("should return 422 with username shorter than 3 characters", async () => {
    const res = await request(app)
      .patch("/user/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ username: "ab" })

    expect(res.status).toBe(422)
  })
})