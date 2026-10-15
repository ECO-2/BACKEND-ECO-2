import { prisma } from "@/lib/prisma"

export const isPaypalCheckoutEnabled = async () => {
  const config = await prisma.appConfig.findUnique({ where: { id: "singleton" } })
  return config?.paypal_checkout_enabled ?? false
}