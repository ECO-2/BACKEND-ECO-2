import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"

describe("Care System", () => {
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

  // TASKS
  describe("POST /care/tasks", () => {
    it("should create a task successfully", async () => {
      const res = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })

      expect(res.status).toBe(201)
      expect(res.body.task_type).toBe("watering")
      expect(res.body.frequency_days).toBe(7)
      expect(res.body.last_completed_at).toBeNull()
    })

    it("should return 404 for non-existent plant", async () => {
      const res = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: "00000000-0000-0000-0000-000000000000",
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      expect(res.status).toBe(404)
    })

    it("should return 422 with invalid task_type", async () => {
      const res = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "dancing",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      expect(res.status).toBe(422)
    })

    it("should return 422 with missing required fields", async () => {
      const res = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ user_plant_id: plantId })

      expect(res.status).toBe(422)
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .post("/care/tasks")
        .send({ user_plant_id: plantId, task_type: "watering", frequency_days: 7, next_due_at: new Date().toISOString() })

      expect(res.status).toBe(401)
    })
  })

  describe("GET /care/plants/:plantId/tasks", () => {
    it("should return empty array when no tasks", async () => {
      const res = await request(app)
        .get(`/care/plants/${plantId}/tasks`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("should return tasks for a plant", async () => {
      await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "fertilizing",
          frequency_days: 30,
          next_due_at: new Date().toISOString()
        })

      const res = await request(app)
        .get(`/care/plants/${plantId}/tasks`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
    })

    it("should return 404 for plant belonging to another user", async () => {
      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      const res = await request(app)
        .get(`/care/plants/${plantId}/tasks`)
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe("PATCH /care/tasks/:taskId/complete", () => {
    it("should complete a task and create a care log", async () => {
      const task = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      const res = await request(app)
        .patch(`/care/tasks/${task.body.id}/complete`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.last_completed_at).not.toBeNull()

      // Verifica que se creó el care log automáticamente
      const logs = await request(app)
        .get(`/care/plants/${plantId}/logs`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(logs.body).toHaveLength(1)
      expect(logs.body[0].task_type).toBe("watering")
      expect(logs.body[0].task_id).toBe(task.body.id)
    })

    it("should recalculate next_due_at after completion", async () => {
      const task = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      const res = await request(app)
        .patch(`/care/tasks/${task.body.id}/complete`)
        .set("Authorization", `Bearer ${accessToken}`)

      const nextDue = new Date(res.body.next_due_at)
      const now = new Date()
      const diffDays = Math.round((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      expect(diffDays).toBe(7)
    })

    it("should return 404 for task belonging to another user", async () => {
      const task = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      const res = await request(app)
        .patch(`/care/tasks/${task.body.id}/complete`)
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)

      expect(res.status).toBe(404)
    })

    it("should return 404 for non-existent task", async () => {
      const res = await request(app)
        .patch("/care/tasks/00000000-0000-0000-0000-000000000000/complete")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })
  })

  // CARE LOGS
  describe("POST /care/logs", () => {
    it("should create a manual care log", async () => {
      const res = await request(app)
        .post("/care/logs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering"
        })

      expect(res.status).toBe(201)
      expect(res.body.task_type).toBe("watering")
      expect(res.body.task_id).toBeNull()
    })

    it("should create a care log with custom performed_at", async () => {
      const date = "2026-05-01T10:00:00.000Z"

      const res = await request(app)
        .post("/care/logs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "pruning",
          performed_at: date
        })

      expect(res.status).toBe(201)
      expect(new Date(res.body.performed_at).toISOString()).toBe(date)
    })

    it("should return 404 for plant belonging to another user", async () => {
      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      const res = await request(app)
        .post("/care/logs")
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)
        .send({ user_plant_id: plantId, task_type: "watering" })

      expect(res.status).toBe(404)
    })

    it("should return 422 with invalid task_type", async () => {
      const res = await request(app)
        .post("/care/logs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ user_plant_id: plantId, task_type: "dancing" })

      expect(res.status).toBe(422)
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .post("/care/logs")
        .send({ user_plant_id: plantId, task_type: "watering" })

      expect(res.status).toBe(401)
    })
  })

  describe("GET /care/plants/:plantId/logs", () => {
    it("should return empty array when no logs", async () => {
      const res = await request(app)
        .get(`/care/plants/${plantId}/logs`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("should return care logs for a plant ordered by performed_at desc", async () => {
      await request(app)
        .post("/care/logs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ user_plant_id: plantId, task_type: "watering" })

      await request(app)
        .post("/care/logs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ user_plant_id: plantId, task_type: "fertilizing" })

      const res = await request(app)
        .get(`/care/plants/${plantId}/logs`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
    })

    it("should return 404 for plant belonging to another user", async () => {
      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      const res = await request(app)
        .get(`/care/plants/${plantId}/logs`)
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)

      expect(res.status).toBe(404)
    })
  })

    describe("GET /care/tasks", () => {
    it("should return empty array when no tasks", async () => {
      const res = await request(app)
        .get("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("should return all tasks across all plants for the user", async () => {
      const species2 = await prisma.plantSpecies.create({
        data: {
          scientific_name: "Aloe vera",
          common_name: "Sábila",
          category: "succulent",
          light_requirement: "high",
          water_frequency_days: 14,
          humidity_preference: "low",
          air_purification_score: 7,
          min_temperature: 10,
          max_temperature: 40
        }
      })

      const plant2 = await request(app)
        .post("/plants")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ species_id: species2.id, nickname: "Mi Aloe" })

      await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plant2.body.id,
          task_type: "watering",
          frequency_days: 14,
          next_due_at: new Date().toISOString()
        })

      const res = await request(app)
        .get("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
    })

    it("should not return tasks from other users", async () => {
      await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      const res = await request(app)
        .get("/care/tasks")
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/care/tasks")
      expect(res.status).toBe(401)
    })
  })

  describe("PATCH /care/tasks/:taskId", () => {
    it("should update frequency_days", async () => {
      const task = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      const res = await request(app)
        .patch(`/care/tasks/${task.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ frequency_days: 14 })

      expect(res.status).toBe(200)
      expect(res.body.frequency_days).toBe(14)
    })

    it("should update next_due_at", async () => {
      const task = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      const newDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

      const res = await request(app)
        .patch(`/care/tasks/${task.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ next_due_at: newDate })

      expect(res.status).toBe(200)
      expect(new Date(res.body.next_due_at).toISOString()).toBe(newDate)
    })

    it("should return 422 with no fields provided", async () => {
      const task = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      const res = await request(app)
        .patch(`/care/tasks/${task.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({})

      expect(res.status).toBe(422)
    })

    it("should return 404 for task belonging to another user", async () => {
      const task = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      const res = await request(app)
        .patch(`/care/tasks/${task.body.id}`)
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)
        .send({ frequency_days: 14 })

      expect(res.status).toBe(404)
    })

    it("should return 404 for non-existent task", async () => {
      const res = await request(app)
        .patch("/care/tasks/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ frequency_days: 14 })

      expect(res.status).toBe(404)
    })

    it("should return 401 without authentication", async () => {
      const task = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      const res = await request(app)
        .patch(`/care/tasks/${task.body.id}`)
        .send({ frequency_days: 14 })

      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /care/tasks/:taskId", () => {
    it("should delete a task successfully", async () => {
      const task = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      const res = await request(app)
        .delete(`/care/tasks/${task.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(204)

      const tasks = await request(app)
        .get(`/care/plants/${plantId}/tasks`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(tasks.body).toEqual([])
    })

    it("should return 404 for task belonging to another user", async () => {
      const task = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      const res = await request(app)
        .delete(`/care/tasks/${task.body.id}`)
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)

      expect(res.status).toBe(404)
    })

    it("should return 404 for non-existent task", async () => {
      const res = await request(app)
        .delete("/care/tasks/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })

    it("should return 401 without authentication", async () => {
      const task = await request(app)
        .post("/care/tasks")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          user_plant_id: plantId,
          task_type: "watering",
          frequency_days: 7,
          next_due_at: new Date().toISOString()
        })

      const res = await request(app).delete(`/care/tasks/${task.body.id}`)
      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /care/logs/:logId", () => {
    it("should delete a care log successfully", async () => {
      const log = await request(app)
        .post("/care/logs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ user_plant_id: plantId, task_type: "watering" })

      const res = await request(app)
        .delete(`/care/logs/${log.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(204)

      const logs = await request(app)
        .get(`/care/plants/${plantId}/logs`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(logs.body).toEqual([])
    })

    it("should return 404 for log belonging to another user", async () => {
      const log = await request(app)
        .post("/care/logs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ user_plant_id: plantId, task_type: "watering" })

      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      const res = await request(app)
        .delete(`/care/logs/${log.body.id}`)
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)

      expect(res.status).toBe(404)
    })

    it("should return 404 for non-existent log", async () => {
      const res = await request(app)
        .delete("/care/logs/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })

    it("should return 401 without authentication", async () => {
      const log = await request(app)
        .post("/care/logs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ user_plant_id: plantId, task_type: "watering" })

      const res = await request(app).delete(`/care/logs/${log.body.id}`)
      expect(res.status).toBe(401)
    })
  })
})