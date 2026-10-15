import { AppError } from "@/core/errors/AppError"
import { getPaypalOrder, capturePaypalOrder } from "@/infrastructure/services/paypal.service"
import { findPaymentByOrderId, markPaymentCompleted } from "@/infrastructure/repositories/payment.repository"
import { activatePlusUseCase } from "@/application/use-cases/plan/activate-plus.usecase"

export const capturePaypalOrderUseCase = async (orderId: string) => {
  const payment = await findPaymentByOrderId(orderId)
  if (!payment) throw new AppError("Payment not found", 404)
  if (payment.status === "completed") return { status: "completed" as const }

  const order = await getPaypalOrder(orderId)
  if (order.status === "APPROVED") {
    const captured = await capturePaypalOrder(orderId)
    if (captured.status !== "COMPLETED") return { status: "pending" as const }
  } else if (order.status !== "COMPLETED") {
    return { status: "pending" as const }
  }

  const marked = await markPaymentCompleted(payment.id)
  if (marked) await activatePlusUseCase(payment.user_id, { months: payment.months })

  return { status: "completed" as const }
}