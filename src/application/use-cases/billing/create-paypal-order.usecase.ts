import { AppError } from "@/core/errors/AppError"
import { PLUS_MONTHS, PLUS_PRICE_CENTS, PLUS_PRICE_CURRENCY } from "@/domain/plans/pricing"
import { isPaypalCheckoutEnabled } from "@/application/services/billing-config.service"
import { createPaypalOrder } from "@/infrastructure/services/paypal.service"
import { createPayment } from "@/infrastructure/repositories/payment.repository"

export const createPaypalOrderUseCase = async (userId: string) => {
  if (!(await isPaypalCheckoutEnabled())) throw new AppError("paypal_checkout_disabled", 403)

  const publicUrl = process.env.PUBLIC_API_URL ?? "https://api.eco2app.com"
  const order = await createPaypalOrder({
    amount: (PLUS_PRICE_CENTS / 100).toFixed(2),
    currency: PLUS_PRICE_CURRENCY,
    description: "ECO2 O2+ (12 mes)",
    returnUrl: `${publicUrl}/billing/paypal/return`,
    cancelUrl: `${publicUrl}/billing/paypal/cancel`
  })

  await createPayment({
    user_id: userId,
    provider_order_id: order.id,
    amount_cents: PLUS_PRICE_CENTS,
    currency: PLUS_PRICE_CURRENCY,
    months: PLUS_MONTHS
  })

  return { order_id: order.id, approval_url: order.approval_url }
}