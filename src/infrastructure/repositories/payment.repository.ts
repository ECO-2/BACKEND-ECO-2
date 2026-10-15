import { prisma } from "@/lib/prisma"

export const createPayment = async (data: {
  user_id: string
  provider_order_id: string
  amount_cents: number
  currency: string
  months: number
}) => {
  return prisma.payment.create({ data })
}

export const findPaymentByOrderId = async (orderId: string) => {
  return prisma.payment.findUnique({ where: { provider_order_id: orderId } })
}

export const markPaymentCompleted = async (id: string) => {
  const result = await prisma.payment.updateMany({
    where: { id, status: "pending" },
    data: { status: "completed", completed_at: new Date() }
  })
  return result.count === 1
}