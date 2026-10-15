import { Request, Response, NextFunction } from "express"
import { AppError } from "@/core/errors/AppError"
import { createPaypalOrderUseCase } from "@/application/use-cases/billing/create-paypal-order.usecase"
import { capturePaypalOrderUseCase } from "@/application/use-cases/billing/capture-paypal-order.usecase"
import { renderBillingPage } from "@/interfaces/views/billing-pages"

export const createPaypalOrderController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await createPaypalOrderUseCase(req.user!.sub)
    res.status(201).json(order)
  } catch (error) { next(error) }
}

export const paypalReturnController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = typeof req.query.token === "string" ? req.query.token : ""
    if (!orderId) throw new AppError("Missing order token", 400)

    const result = await capturePaypalOrderUseCase(orderId)
    const page = result.status === "completed"
      ? renderBillingPage("Pago completado", "Tu plan O2+ ya está activo. Vuelve a ECO2 para disfrutarlo.")
      : renderBillingPage("Pago pendiente", "Todavía no recibimos la confirmación del pago. Vuelve a ECO2 e inténtalo de nuevo.")
    res.status(200).type("html").send(page)
  } catch (error) { next(error) }
}

export const paypalCancelController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).type("html").send(
      renderBillingPage("Pago cancelado", "No se hizo ningún cobro. Vuelve a ECO2 cuando quieras activar O2+.")
    )
  } catch (error) { next(error) }
}