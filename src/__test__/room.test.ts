import request from "supertest"
import app from "@/app"

describe("Rooms CRUD", () => {
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

  // CREATE
  describe("POST /rooms", () => {
    it("should create a room successfully", async () => {
      const res = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Sala", size_m2: 20.5, light_level: "medium" })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe("Sala")
      expect(res.body.light_level).toBe("medium")
      expect(res.body.user_id).toBeDefined()
    })

    it("should create a room with only name", async () => {
      const res = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Balcón" })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe("Balcón")
      expect(res.body.size_m2).toBeNull()
      expect(res.body.light_level).toBeNull()
    })

    it("should return 422 with missing name", async () => {
      const res = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ size_m2: 15 })

      expect(res.status).toBe(422)
    })

    it("should return 422 with invalid light_level", async () => {
      const res = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Cocina", light_level: "ultra_bright" })

      expect(res.status).toBe(422)
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .post("/rooms")
        .send({ name: "Sin auth" })

      expect(res.status).toBe(401)
    })
  })

  // GET ALL
  describe("GET /rooms", () => {
    it("should return empty array when no rooms exist", async () => {
      const res = await request(app)
        .get("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    it("should return only rooms belonging to the authenticated user", async () => {
      await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Sala" })

      await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Cocina" })

      const res = await request(app)
        .get("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
    })

    it("should not return rooms from other users", async () => {
      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)
        .send({ name: "Sala del otro" })

      const res = await request(app)
        .get("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(0)
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app).get("/rooms")
      expect(res.status).toBe(401)
    })
  })

  // GET ONE
  describe("GET /rooms/:id", () => {
    it("should return a room by id", async () => {
      const created = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Dormitorio", light_level: "low" })

      const res = await request(app)
        .get(`/rooms/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.name).toBe("Dormitorio")
    })

    it("should return 404 for non-existent room", async () => {
      const res = await request(app)
        .get("/rooms/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })

    it("should return 404 for room belonging to another user", async () => {
      await request(app)
        .post("/auth/register")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherLogin = await request(app)
        .post("/auth/login")
        .send({ email: "other@eco2.com", password: "secret123" })

      const otherRoom = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${otherLogin.body.accessToken}`)
        .send({ name: "Sala ajena" })

      const res = await request(app)
        .get(`/rooms/${otherRoom.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })
  })

  // UPDATE
  describe("PATCH /rooms/:id", () => {
    it("should update room name", async () => {
      const created = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Sala" })

      const res = await request(app)
        .patch(`/rooms/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Sala Principal" })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe("Sala Principal")
    })

    it("should update light_level", async () => {
      const created = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Sala", light_level: "low" })

      const res = await request(app)
        .patch(`/rooms/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ light_level: "high" })

      expect(res.status).toBe(200)
      expect(res.body.light_level).toBe("high")
    })

    it("should return 404 for non-existent room", async () => {
      const res = await request(app)
        .patch("/rooms/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "No existe" })

      expect(res.status).toBe(404)
    })

    it("should return 422 with invalid light_level", async () => {
      const created = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Sala" })

      const res = await request(app)
        .patch(`/rooms/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ light_level: "invalid" })

      expect(res.status).toBe(422)
    })
  })

  // DELETE
  describe("DELETE /rooms/:id", () => {
    it("should soft delete a room", async () => {
      const created = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Sala" })

      const res = await request(app)
        .delete(`/rooms/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(204)
    })

    it("should not return deleted room in list", async () => {
      const created = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Sala" })

      await request(app)
        .delete(`/rooms/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      const res = await request(app)
        .get("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.body).toHaveLength(0)
    })

    it("should return 404 for already deleted room", async () => {
      const created = await request(app)
        .post("/rooms")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Sala" })

      await request(app)
        .delete(`/rooms/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      const res = await request(app)
        .delete(`/rooms/${created.body.id}`)
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })

    it("should return 404 for non-existent room", async () => {
      const res = await request(app)
        .delete("/rooms/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })
  })
})