import { AppError } from "@/core/errors/AppError"

type PaypalLink = { rel: string; href: string }

const baseUrl = () => process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com"

const getAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new AppError("paypal_not_configured", 503)

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const response = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  })
  if (!response.ok) throw new AppError("paypal_auth_failed", 502)

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

export const createPaypalOrder = async (input: {
  amount: string
  currency: string
  description: string
  returnUrl: string
  cancelUrl: string
}) => {
  const token = await getAccessToken()
  const response = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: input.description,
          amount: { currency_code: input.currency, value: input.amount }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "ECO2",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl
          }
        }
      }
    })
  })
  if (!response.ok) throw new AppError("paypal_order_failed", 502)

  const order = (await response.json()) as { id: string; links: PaypalLink[] }
  const approval = order.links.find(link => link.rel === "payer-action" || link.rel === "approve")
  if (!approval) throw new AppError("paypal_order_failed", 502)

  return { id: order.id, approval_url: approval.href }
}

export const getPaypalOrder = async (orderId: string) => {
  const token = await getAccessToken()
  const response = await fetch(`${baseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new AppError("paypal_order_lookup_failed", 502)

  const order = (await response.json()) as { status: string }
  return { status: order.status }
}

export const capturePaypalOrder = async (orderId: string) => {
  const token = await getAccessToken()
  const response = await fetch(`${baseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  })
  if (!response.ok) throw new AppError("paypal_capture_failed", 502)

  const capture = (await response.json()) as { status: string }
  return { status: capture.status }
}