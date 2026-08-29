import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"

jest.mock("@/lib/firebase", () => ({
  firebaseAdmin: {
    messaging: () => ({
      sendEachForMulticast: jest.fn().mockResolvedValue({
        responses: []
      })
    })
  }
}))

jest.mock("@/lib/resend", () => ({
  resend: {
    emails: {
      send: jest.fn().mockResolvedValue({ id: "mock-email-id" })
    }
  }
}))

describe("POST /internal/run-reminders", () => {
  const internalKey = process.env.INTERNAL_API_KEY!
  let accessToken: string
  let plantId: string

  beforeEach(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    const login = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "secret123" })

    accessToken = login.body.accessToken

    const species = await prisma.plantSpecies.create({
      data: {
        scientific_name: "Monstera deliciosa",
        common_name: "Monstera",
        category: "tropical",
        light_requirement: "indirect",
        water_frequency_days: 7,
        humidity_preference: "high",
        air_purification_score: 8,
        min_temperature: 18,
        max_temperature: 30
      }
    })

    const plant = await request(app)
      .post("/plants")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ species_id: species.id, nickname: "Mi Monstera" })

    plantId = plant.body.id
  })

  it("should return 401 without the internal key", async () => {
    const res = await request(app).post("/internal/run-reminders")
    expect(res.status).toBe(401)
  })

  it("should return 401 with an incorrect internal key", async () => {
    const res = await request(app)
      .post("/internal/run-reminders")
      .set("x-internal-key", "wrong-key")

    expect(res.status).toBe(401)
  })

  it("should process overdue tasks within the reminder window", async () => {
    const user = await prisma.user.update({
      where: { email: "test@eco2.com" },
      data: { reminder_start_hour: 0, reminder_end_hour: 23 }
    })

    await request(app)
      .post("/care/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        user_plant_id: plantId,
        task_type: "watering",
        frequency_days: 7,
        next_due_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // hace 1 hora
      })

    const res = await request(app)
      .post("/internal/run-reminders")
      .set("x-internal-key", internalKey)

    expect(res.status).toBe(200)
    expect(res.body.checked).toBeGreaterThanOrEqual(1)
  })

  it("should skip users with notifications disabled", async () => {
    await prisma.user.update({
      where: { email: "test@eco2.com" },
      data: { notifications_enabled: false, reminder_start_hour: 0, reminder_end_hour: 23 }
    })

    await request(app)
      .post("/care/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        user_plant_id: plantId,
        task_type: "watering",
        frequency_days: 7,
        next_due_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      })

    const res = await request(app)
      .post("/internal/run-reminders")
      .set("x-internal-key", internalKey)

    expect(res.status).toBe(200)
    expect(res.body.sent).toBe(0)
  })
})