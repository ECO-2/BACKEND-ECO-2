import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"
import { generateAccessToken } from "@/utils/jwt"

describe("Gamification", () => {
  let accessToken: string
  let adminToken: string
  let userId: string

  beforeEach(async () => {
    // Usuario normal
    await request(app)
      .post("/auth/register")
      .send({ email: "test@eco2.com", password: "secret123" })

    const login = await request(app)
      .post("/auth/login")
      .send({ email: "test@eco2.com", password: "secret123" })

    accessToken = login.body.accessToken
    userId = login.body.accessToken
      ? JSON.parse(
          Buffer.from(login.body.accessToken.split(".")[1], "base64").toString()
        ).sub
      : null

    // Admin creado directamente
    const admin = await prisma.user.create({
      data: {
        email: "admin@eco2.com",
        password_hash: "irrelevant",
        provider: "local",
        role: "admin"
      }
    })

    adminToken = generateAccessToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role
    })
  })

  beforeEach(async () => {
    await prisma.userAchievement.deleteMany()
    await prisma.xpLog.deleteMany()
    await prisma.seedTransaction.deleteMany()
    await prisma.userProgress.deleteMany()
    await prisma.achievement.deleteMany()
  })

  afterAll(async () => {
    await prisma.userAchievement.deleteMany()
    await prisma.xpLog.deleteMany()
    await prisma.seedTransaction.deleteMany()
    await prisma.userProgress.deleteMany()
    await prisma.achievement.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
  })

  // PROGRESS
  describe("GET /gamification/progress", () => {
    it("should return default progress when no XP earned yet", async () => {
      const res = await request(app)
        .get("/gamification/progress")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.xp).toBe(0)
      expect(res.body.level).toBe(1)
      expect(res.body.streak_days).toBe(0)
      expect(res.body.seeds).toBe(0)
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/gamification/progress")
      expect(res.status).toBe(401)
    })
  })

  describe("POST /gamification/progress/xp", () => {
    it("should add XP and create a log", async () => {
      const res = await request(app)
        .post("/gamification/progress/xp")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 50, action_type: "plant_watered" })

      expect(res.status).toBe(200)
      expect(res.body.xp).toBe(50)
    })

    it("should accumulate XP across multiple calls", async () => {
      await request(app)
        .post("/gamification/progress/xp")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 50, action_type: "plant_watered" })

      const res = await request(app)
        .post("/gamification/progress/xp")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 30, action_type: "care_logged" })

      expect(res.status).toBe(200)
      expect(res.body.xp).toBe(80)
    })

    it("should return 422 with invalid amount", async () => {
      const res = await request(app)
        .post("/gamification/progress/xp")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: -10, action_type: "plant_watered" })

      expect(res.status).toBe(422)
    })

    it("should return 422 with missing action_type", async () => {
      const res = await request(app)
        .post("/gamification/progress/xp")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 10 })

      expect(res.status).toBe(422)
    })
  })

  describe("POST /gamification/progress/seeds", () => {
    it("should add seeds and create a transaction", async () => {
      const res = await request(app)
        .post("/gamification/progress/seeds")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 10, reason: "daily_login" })

      expect(res.status).toBe(200)
      expect(res.body.seeds).toBe(10)
    })

    it("should allow negative amount to spend seeds", async () => {
      await request(app)
        .post("/gamification/progress/seeds")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 50, reason: "daily_login" })

      const res = await request(app)
        .post("/gamification/progress/seeds")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: -20, reason: "store_purchase" })

      expect(res.status).toBe(200)
      expect(res.body.seeds).toBe(30)
    })

    it("should return 422 with missing reason", async () => {
      const res = await request(app)
        .post("/gamification/progress/seeds")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 10 })

      expect(res.status).toBe(422)
    })
  })

  describe("PATCH /gamification/progress", () => {
    it("should update level", async () => {
      const res = await request(app)
        .patch("/gamification/progress")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ level: 5 })

      expect(res.status).toBe(200)
      expect(res.body.level).toBe(5)
    })

    it("should update streak_days", async () => {
      const res = await request(app)
        .patch("/gamification/progress")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ streak_days: 7 })

      expect(res.status).toBe(200)
      expect(res.body.streak_days).toBe(7)
    })

    it("should return 400 with empty body", async () => {
      const res = await request(app)
        .patch("/gamification/progress")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({})

      expect(res.status).toBe(400)
    })
  })

  describe("GET /gamification/progress/xp-logs", () => {
    it("should return empty array when no XP earned", async () => {
      const res = await request(app)
        .get("/gamification/progress/xp-logs")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("should return XP logs after earning XP", async () => {
      await request(app)
        .post("/gamification/progress/xp")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 50, action_type: "plant_watered" })

      await request(app)
        .post("/gamification/progress/xp")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 30, action_type: "care_logged" })

      const res = await request(app)
        .get("/gamification/progress/xp-logs")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
      expect(res.body[0].action_type).toBeDefined()
      expect(res.body[0].xp_earned).toBeDefined()
    })
  })

  describe("GET /gamification/progress/seed-transactions", () => {
    it("should return seed transactions", async () => {
      await request(app)
        .post("/gamification/progress/seeds")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 10, reason: "daily_login" })

      const res = await request(app)
        .get("/gamification/progress/seed-transactions")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].amount).toBe(10)
      expect(res.body[0].reason).toBe("daily_login")
    })
  })

  // ACHIEVEMENTS
  describe("GET /gamification/achievements", () => {
    it("should return empty array when no achievements", async () => {
      const res = await request(app)
        .get("/gamification/achievements")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("should return all achievements", async () => {
      await prisma.achievement.create({
        data: {
          name: "Primera Planta",
          description: "Registra tu primera planta",
          condition_type: "plant_count",
          condition_value: 1,
          xp_reward: 100
        }
      })

      const res = await request(app)
        .get("/gamification/achievements")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
    })
  })

  describe("POST /gamification/achievements — admin only", () => {
    it("should create an achievement as admin", async () => {
      const res = await request(app)
        .post("/gamification/achievements")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Primera Planta",
          description: "Registra tu primera planta",
          condition_type: "plant_count",
          condition_value: 1,
          xp_reward: 100
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe("Primera Planta")
      expect(res.body.xp_reward).toBe(100)
    })

    it("should return 403 for non-admin user", async () => {
      const res = await request(app)
        .post("/gamification/achievements")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Primera Planta",
          description: "Registra tu primera planta",
          condition_type: "plant_count",
          condition_value: 1,
          xp_reward: 100
        })

      expect(res.status).toBe(403)
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .post("/gamification/achievements")
        .send({ name: "Test", description: "Test", condition_type: "test", condition_value: 1, xp_reward: 10 })

      expect(res.status).toBe(401)
    })

    it("should return 422 with missing required fields", async () => {
      const res = await request(app)
        .post("/gamification/achievements")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Incompleto" })

      expect(res.status).toBe(422)
    })
  })

  describe("PATCH /gamification/achievements/:id — admin only", () => {
    it("should update an achievement as admin", async () => {
      const achievement = await prisma.achievement.create({
        data: {
          name: "Primera Planta",
          description: "Registra tu primera planta",
          condition_type: "plant_count",
          condition_value: 1,
          xp_reward: 100
        }
      })

      const res = await request(app)
        .patch(`/gamification/achievements/${achievement.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ xp_reward: 200 })

      expect(res.status).toBe(200)
      expect(res.body.xp_reward).toBe(200)
    })

    it("should return 403 for non-admin user", async () => {
      const achievement = await prisma.achievement.create({
        data: {
          name: "Primera Planta",
          description: "Test",
          condition_type: "plant_count",
          condition_value: 1,
          xp_reward: 100
        }
      })

      const res = await request(app)
        .patch(`/gamification/achievements/${achievement.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ xp_reward: 200 })

      expect(res.status).toBe(403)
    })

    it("should return 404 for non-existent achievement", async () => {
      const res = await request(app)
        .patch("/gamification/achievements/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ xp_reward: 200 })

      expect(res.status).toBe(404)
    })
  })

  describe("GET /gamification/achievements/me", () => {
    it("should return empty array when no achievements unlocked", async () => {
      const res = await request(app)
        .get("/gamification/achievements/me")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("should return unlocked achievements", async () => {
      const achievement = await prisma.achievement.create({
        data: {
          name: "Primera Planta",
          description: "Test",
          condition_type: "plant_count",
          condition_value: 1,
          xp_reward: 100
        }
      })

      await request(app)
        .post(`/gamification/achievements/${achievement.id}/unlock`)
        .set("Authorization", `Bearer ${accessToken}`)

      const res = await request(app)
        .get("/gamification/achievements/me")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].achievement.name).toBe("Primera Planta")
    })
  })

  describe("POST /gamification/achievements/:id/unlock", () => {
    it("should unlock an achievement", async () => {
      const achievement = await prisma.achievement.create({
        data: {
          name: "Primera Planta",
          description: "Test",
          condition_type: "plant_count",
          condition_value: 1,
          xp_reward: 100
        }
      })

      const res = await request(app)
        .post(`/gamification/achievements/${achievement.id}/unlock`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(201)
      expect(res.body.achievement.name).toBe("Primera Planta")
    })

    it("should return 409 if achievement already unlocked", async () => {
      const achievement = await prisma.achievement.create({
        data: {
          name: "Primera Planta",
          description: "Test",
          condition_type: "plant_count",
          condition_value: 1,
          xp_reward: 100
        }
      })

      await request(app)
        .post(`/gamification/achievements/${achievement.id}/unlock`)
        .set("Authorization", `Bearer ${accessToken}`)

      const res = await request(app)
        .post(`/gamification/achievements/${achievement.id}/unlock`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(409)
    })

    it("should return 404 for non-existent achievement", async () => {
      const res = await request(app)
        .post("/gamification/achievements/00000000-0000-0000-0000-000000000000/unlock")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })

    it("should credit xp_reward and seed_reward to the user's progress", async () => {
      const achievement = await prisma.achievement.create({
        data: {
          name: "Primera Planta",
          description: "Test",
          condition_type: "plant_count",
          condition_value: 1,
          xp_reward: 100,
          seed_reward: 20
        }
      })

      await request(app)
        .post(`/gamification/achievements/${achievement.id}/unlock`)
        .set("Authorization", `Bearer ${accessToken}`)

      const res = await request(app)
        .get("/gamification/progress")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.body.xp).toBe(100)
      expect(res.body.seeds).toBe(20)
    })
  })
})