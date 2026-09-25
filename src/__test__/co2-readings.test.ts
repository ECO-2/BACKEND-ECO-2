import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"

jest.mock("@/infrastructure/services/notification.service", () => ({
  notifyUser: jest.fn().mockResolvedValue(true)
}))

import { notifyUser } from "@/infrastructure/services/notification.service"

const DEVICE_KEY = process.env.DEVICE_API_KEY!

describe("CO2 Readings", () => {
  let accessToken: string
  let userId: string

  beforeEach(async () => {
    jest.clearAllMocks()

    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    const login = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "secret123" })
    accessToken = login.body.accessToken

    const user = await prisma.user.findUnique({ where: { email: "test@eco2.com" } })
    userId = user!.id
  })

  describe("POST /co2-readings", () => {
    it("should create a reading with a valid device key", async () => {
      const res = await request(app)
        .post("/co2-readings")
        .set("x-device-key", DEVICE_KEY)
        .send({ user_id: userId, co2_ppm: 850 })

      expect(res.status).toBe(201)
      expect(res.body.co2_ppm).toBe(850)
      expect(res.body.user_id).toBe(userId)
    })

    it("should return 401 without a device key", async () => {
      const res = await request(app)
        .post("/co2-readings")
        .send({ user_id: userId, co2_ppm: 850 })

      expect(res.status).toBe(401)
    })

    it("should return 401 with an incorrect device key", async () => {
      const res = await request(app)
        .post("/co2-readings")
        .set("x-device-key", "wrong-key")
        .send({ user_id: userId, co2_ppm: 850 })

      expect(res.status).toBe(401)
    })

    it("should return 404 for a non-existent user", async () => {
      const res = await request(app)
        .post("/co2-readings")
        .set("x-device-key", DEVICE_KEY)
        .send({ user_id: "00000000-0000-0000-0000-000000000000", co2_ppm: 850 })

      expect(res.status).toBe(404)
    })

    it("should return 422 with missing co2_ppm", async () => {
      const res = await request(app)
        .post("/co2-readings")
        .set("x-device-key", DEVICE_KEY)
        .send({ user_id: userId })

      expect(res.status).toBe(422)
    })

    describe("high CO2 alert (hysteresis)", () => {
      it("should notify when crossing the threshold from a normal reading", async () => {
        await request(app)
          .post("/co2-readings")
          .set("x-device-key", DEVICE_KEY)
          .send({ user_id: userId, co2_ppm: 800 })

        await request(app)
          .post("/co2-readings")
          .set("x-device-key", DEVICE_KEY)
          .send({ user_id: userId, co2_ppm: 2100 })

        expect(notifyUser).toHaveBeenCalledTimes(1)
      })

      it("should not notify again while readings stay above the reset threshold", async () => {
        await request(app)
          .post("/co2-readings")
          .set("x-device-key", DEVICE_KEY)
          .send({ user_id: userId, co2_ppm: 2100 })

        await request(app)
          .post("/co2-readings")
          .set("x-device-key", DEVICE_KEY)
          .send({ user_id: userId, co2_ppm: 2050 })

        expect(notifyUser).toHaveBeenCalledTimes(1)
      })

      it("should notify again after dropping below the reset threshold and rising again", async () => {
        await request(app)
          .post("/co2-readings")
          .set("x-device-key", DEVICE_KEY)
          .send({ user_id: userId, co2_ppm: 2100 })

        await request(app)
          .post("/co2-readings")
          .set("x-device-key", DEVICE_KEY)
          .send({ user_id: userId, co2_ppm: 1700 })

        await request(app)
          .post("/co2-readings")
          .set("x-device-key", DEVICE_KEY)
          .send({ user_id: userId, co2_ppm: 2200 })

        expect(notifyUser).toHaveBeenCalledTimes(2)
      })

      it("should not notify for a normal first reading", async () => {
        await request(app)
          .post("/co2-readings")
          .set("x-device-key", DEVICE_KEY)
          .send({ user_id: userId, co2_ppm: 900 })

        expect(notifyUser).not.toHaveBeenCalled()
      })
    })
  })

  describe("GET /co2-readings/latest", () => {
    it("should return the most recent reading", async () => {
      await request(app)
        .post("/co2-readings")
        .set("x-device-key", DEVICE_KEY)
        .send({ user_id: userId, co2_ppm: 700 })

      await request(app)
        .post("/co2-readings")
        .set("x-device-key", DEVICE_KEY)
        .send({ user_id: userId, co2_ppm: 950 })

      const res = await request(app)
        .get("/co2-readings/latest")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.co2_ppm).toBe(950)
    })

    it("should return null when there are no readings", async () => {
      const res = await request(app)
        .get("/co2-readings/latest")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toBeNull()
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/co2-readings/latest")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /co2-readings", () => {
    it("should return all readings for the user, ordered by most recent first", async () => {
      await request(app)
        .post("/co2-readings")
        .set("x-device-key", DEVICE_KEY)
        .send({ user_id: userId, co2_ppm: 700 })

      await request(app)
        .post("/co2-readings")
        .set("x-device-key", DEVICE_KEY)
        .send({ user_id: userId, co2_ppm: 950 })

      const res = await request(app)
        .get("/co2-readings")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
      expect(res.body[0].co2_ppm).toBe(950)
    })

    it("should not return readings from other users", async () => {
      await request(app)
        .post("/co2-readings")
        .set("x-device-key", DEVICE_KEY)
        .send({ user_id: userId, co2_ppm: 700 })

      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      const res = await request(app)
        .get("/co2-readings")
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/co2-readings")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /co2-readings/summary", () => {
    it("should return the current reading and empty history when there are no readings", async () => {
      const res = await request(app)
        .get("/co2-readings/summary")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.current_ppm).toBeNull()
      expect(res.body.last7Days).toEqual([])
    })

    it("should return the current ppm and daily averages", async () => {
      await request(app)
        .post("/co2-readings")
        .set("x-device-key", DEVICE_KEY)
        .send({ user_id: userId, co2_ppm: 600 })

      await request(app)
        .post("/co2-readings")
        .set("x-device-key", DEVICE_KEY)
        .send({ user_id: userId, co2_ppm: 900 })

      const res = await request(app)
        .get("/co2-readings/summary")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.current_ppm).toBe(900)
      expect(res.body.last7Days).toHaveLength(1)
      expect(res.body.last7Days[0].avg_ppm).toBe(750) // (600 + 900) / 2
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/co2-readings/summary")
      expect(res.status).toBe(401)
    })
  })
})