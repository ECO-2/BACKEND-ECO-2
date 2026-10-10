import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"

const DEVICE_KEY = process.env.DEVICE_API_KEY!

describe("POST /care/device-logs", () => {
  let userId: string
  let plantId: string

  beforeEach(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    const user = await prisma.user.findUnique({ where: { email: "test@eco2.com" } })
    userId = user!.id

    const species = await prisma.plantSpecies.create({
      data: {
        scientific_name: "Monstera deliciosa",
        common_name: "Monstera",
        category: "tropical",
        light_requirement: "indirect",
        water_frequency_days: 7,
        humidity_preference: "medium",
        min_temperature: 15,
        max_temperature: 30
      }
    })

    const plant = await prisma.userPlant.create({
      data: { user_id: userId, species_id: species.id }
    })
    plantId = plant.id
  })

  it("should create a watering log with a valid device key", async () => {
    const res = await request(app)
      .post("/care/device-logs")
      .set("x-device-key", DEVICE_KEY)
      .send({ user_id: userId, user_plant_id: plantId })

    expect(res.status).toBe(201)
    expect(res.body.user_plant_id).toBe(plantId)
    expect(res.body.task_type).toBe("watering")
  })

  it("should accept the optional sensor fields", async () => {
    const res = await request(app)
      .post("/care/device-logs")
      .set("x-device-key", DEVICE_KEY)
      .send({ user_id: userId, user_plant_id: plantId, moisture_raw: 2800, pump_duration_ms: 3000 })

    expect(res.status).toBe(201)
  })

  it("should reschedule the watering task and update last_watered_at", async () => {
    const task = await prisma.userPlantTask.create({
      data: {
        user_plant_id: plantId,
        task_type: "watering",
        frequency_days: 7,
        next_due_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    })

    await request(app)
      .post("/care/device-logs")
      .set("x-device-key", DEVICE_KEY)
      .send({ user_id: userId, user_plant_id: plantId })

    const updatedTask = await prisma.userPlantTask.findUnique({ where: { id: task.id } })
    const updatedPlant = await prisma.userPlant.findUnique({ where: { id: plantId } })

    expect(updatedTask!.last_completed_at).not.toBeNull()
    expect(updatedTask!.next_due_at.getTime()).toBeGreaterThan(Date.now())
    expect(updatedPlant!.last_watered_at).not.toBeNull()
  })

  it("should return 401 without a device key", async () => {
    const res = await request(app)
      .post("/care/device-logs")
      .send({ user_id: userId, user_plant_id: plantId })

    expect(res.status).toBe(401)
  })

  it("should return 401 with an incorrect device key", async () => {
    const res = await request(app)
      .post("/care/device-logs")
      .set("x-device-key", "wrong-key")
      .send({ user_id: userId, user_plant_id: plantId })

    expect(res.status).toBe(401)
  })

  it("should return 422 with a missing user_plant_id", async () => {
    const res = await request(app)
      .post("/care/device-logs")
      .set("x-device-key", DEVICE_KEY)
      .send({ user_id: userId })

    expect(res.status).toBe(422)
  })

  it("should return 422 with a malformed user_plant_id", async () => {
    const res = await request(app)
      .post("/care/device-logs")
      .set("x-device-key", DEVICE_KEY)
      .send({ user_id: userId, user_plant_id: "not-a-uuid" })

    expect(res.status).toBe(422)
  })

  it("should return 422 with a non-numeric moisture_raw", async () => {
    const res = await request(app)
      .post("/care/device-logs")
      .set("x-device-key", DEVICE_KEY)
      .send({ user_id: userId, user_plant_id: plantId, moisture_raw: "dry" })

    expect(res.status).toBe(422)
  })

  it("should return 404 for a non-existent plant", async () => {
    const res = await request(app)
      .post("/care/device-logs")
      .set("x-device-key", DEVICE_KEY)
      .send({ user_id: userId, user_plant_id: "00000000-0000-0000-0000-000000000000" })

    expect(res.status).toBe(404)
  })

  it("should return 404 for a soft-deleted plant", async () => {
    await prisma.userPlant.update({ where: { id: plantId }, data: { deleted_at: new Date() } })

    const res = await request(app)
      .post("/care/device-logs")
      .set("x-device-key", DEVICE_KEY)
      .send({ user_id: userId, user_plant_id: plantId })

    expect(res.status).toBe(404)
  })

  it("should return 404 when the plant belongs to another user", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "other@eco2.com", password: "secret123" })

    const other = await prisma.user.findUnique({ where: { email: "other@eco2.com" } })

    const res = await request(app)
      .post("/care/device-logs")
      .set("x-device-key", DEVICE_KEY)
      .send({ user_id: other!.id, user_plant_id: plantId })

    expect(res.status).toBe(404)
  })

  it("should return 200 with the existing log for a duplicate within 60 seconds", async () => {
    const first = await request(app)
      .post("/care/device-logs")
      .set("x-device-key", DEVICE_KEY)
      .send({ user_id: userId, user_plant_id: plantId })

    const second = await request(app)
      .post("/care/device-logs")
      .set("x-device-key", DEVICE_KEY)
      .send({ user_id: userId, user_plant_id: plantId })

    const count = await prisma.careLog.count({ where: { user_plant_id: plantId } })

    expect(first.status).toBe(201)
    expect(second.status).toBe(200)
    expect(second.body.id).toBe(first.body.id)
    expect(count).toBe(1)
  })
})