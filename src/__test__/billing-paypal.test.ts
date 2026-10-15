import request from "supertest"
import app from "@/app"
import { prisma } from "@/lib/prisma"

jest.mock("@/infrastructure/services/paypal.service", () => ({
  createPaypalOrder: jest.fn(),
  getPaypalOrder: jest.fn(),
  capturePaypalOrder: jest.fn()
}))

import {
  createPaypalOrder,
  getPaypalOrder,
  capturePaypalOrder
} from "@/infrastructure/services/paypal.service"

const mockedCreateOrder = createPaypalOrder as jest.Mock
const mockedGetOrder = getPaypalOrder as jest.Mock
const mockedCaptureOrder = capturePaypalOrder as jest.Mock

const setCheckoutFlag = async (enabled: boolean) => {
  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: { paypal_checkout_enabled: enabled },
    create: { id: "singleton", paypal_checkout_enabled: enabled }
  })
}

describe("PayPal billing", () => {
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

    await setCheckoutFlag(true)
    mockedCreateOrder.mockResolvedValue({
      id: "ORDER123",
      approval_url: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER123"
    })
  })

  describe("POST /billing/paypal/orders", () => {
    it("should create an order and a pending payment", async () => {
      const res = await request(app)
        .post("/billing/paypal/orders")
        .set("Authorization", `Bearer ${accessToken}`)

      const payment = await prisma.payment.findUnique({ where: { provider_order_id: "ORDER123" } })

      expect(res.status).toBe(201)
      expect(res.body.order_id).toBe("ORDER123")
      expect(res.body.approval_url).toContain("ORDER123")
      expect(payment!.user_id).toBe(userId)
      expect(payment!.status).toBe("pending")
      expect(payment!.amount_cents).toBe(3999)
    })

    it("should return 403 when the checkout flag is off", async () => {
      await setCheckoutFlag(false)

      const res = await request(app)
        .post("/billing/paypal/orders")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(403)
      expect(mockedCreateOrder).not.toHaveBeenCalled()
    })

    it("should return 401 without authentication", async () => {
      const res = await request(app).post("/billing/paypal/orders")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /billing/paypal/return", () => {
    beforeEach(async () => {
      await request(app)
        .post("/billing/paypal/orders")
        .set("Authorization", `Bearer ${accessToken}`)
    })

    it("should activate Plus when the order is approved and captured", async () => {
      mockedGetOrder.mockResolvedValue({ status: "APPROVED" })
      mockedCaptureOrder.mockResolvedValue({ status: "COMPLETED" })

      const res = await request(app).get("/billing/paypal/return").query({ token: "ORDER123" })
      const plan = await request(app)
        .get("/user/plan")
        .set("Authorization", `Bearer ${accessToken}`)
      const payment = await prisma.payment.findUnique({ where: { provider_order_id: "ORDER123" } })

      expect(res.status).toBe(200)
      expect(res.text).toContain("Pago completado")
      expect(plan.body.is_plus_active).toBe(true)
      expect(payment!.status).toBe("completed")
      expect(payment!.completed_at).not.toBeNull()
    })

    it("should not extend the plan again when the return page is opened twice", async () => {
      mockedGetOrder.mockResolvedValue({ status: "APPROVED" })
      mockedCaptureOrder.mockResolvedValue({ status: "COMPLETED" })

      await request(app).get("/billing/paypal/return").query({ token: "ORDER123" })
      const afterFirst = await prisma.user.findUnique({ where: { id: userId } })

      const second = await request(app).get("/billing/paypal/return").query({ token: "ORDER123" })
      const afterSecond = await prisma.user.findUnique({ where: { id: userId } })

      expect(second.status).toBe(200)
      expect(second.text).toContain("Pago completado")
      expect(mockedCaptureOrder).toHaveBeenCalledTimes(1)
      expect(afterSecond!.plan_expires_at!.getTime()).toBe(afterFirst!.plan_expires_at!.getTime())
    })

    it("should not activate Plus when the buyer did not approve the order", async () => {
      mockedGetOrder.mockResolvedValue({ status: "CREATED" })

      const res = await request(app).get("/billing/paypal/return").query({ token: "ORDER123" })
      const plan = await request(app)
        .get("/user/plan")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.text).toContain("Pago pendiente")
      expect(mockedCaptureOrder).not.toHaveBeenCalled()
      expect(plan.body.is_plus_active).toBe(false)
    })

    it("should not activate Plus when the capture does not complete", async () => {
      mockedGetOrder.mockResolvedValue({ status: "APPROVED" })
      mockedCaptureOrder.mockResolvedValue({ status: "DECLINED" })

      const res = await request(app).get("/billing/paypal/return").query({ token: "ORDER123" })
      const plan = await request(app)
        .get("/user/plan")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.text).toContain("Pago pendiente")
      expect(plan.body.is_plus_active).toBe(false)
    })

    it("should return 404 for an unknown order", async () => {
      const res = await request(app).get("/billing/paypal/return").query({ token: "UNKNOWN" })
      expect(res.status).toBe(404)
    })

    it("should return 400 without a token", async () => {
      const res = await request(app).get("/billing/paypal/return")
      expect(res.status).toBe(400)
    })
  })

  describe("GET /billing/paypal/cancel", () => {
    it("should show the cancellation page without charging anything", async () => {
      const res = await request(app).get("/billing/paypal/cancel")

      expect(res.status).toBe(200)
      expect(res.text).toContain("Pago cancelado")
    })
  })

  describe("POST /user/plan/activate", () => {
    it("should keep working while the checkout flag is off", async () => {
      await setCheckoutFlag(false)

      const res = await request(app)
        .post("/user/plan/activate")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({})

      expect(res.status).toBe(200)
      expect(res.body.is_plus_active).toBe(true)
    })

    it("should return 403 once the checkout flag is on", async () => {
      const res = await request(app)
        .post("/user/plan/activate")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({})

      expect(res.status).toBe(403)
    })
  })
})