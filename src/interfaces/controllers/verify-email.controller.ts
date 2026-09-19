import { Request, Response } from "express"
import { verifyEmailUseCase } from "@/application/use-cases/verify-email.usecase";

export const verifyEmailController = async (req: Request, res: Response) => {
  try {
    const result = await verifyEmailUseCase({ token: req.query.token })
    res.status(200).send(renderVerifyPage({
      success: true,
      message: result.alreadyVerified
        ? "Tu correo ya estaba verificado."
        : "¡Correo verificado! Ganaste 10 semillas 🌱"
    }))
  } catch (error) {
    res.status(400).send(renderVerifyPage({
      success: false,
      message: "El enlace no es válido o ya expiró. Vuelve a pedir uno desde la app."
    }))
  }
}

function renderVerifyPage({ success, message }: { success: boolean; message: string }) {
  const emoji = success ? "🌱" : "🥀"
  const title = success ? "Email Verification" : "Verification Failed"

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<link rel="icon" href="${process.env.APP_BASE_URL || 'https://api.eco2app.com'}/icono.png">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ECO2 — Verificación</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    background-color: #1F2A2E;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
  }
  .card {
    background: #ffffff;
    padding: 48px 32px;
    border-radius: 16px;
    text-align: center;
    max-width: 380px;
    width: 100%;
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
  }
  .icon-circle {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background-color: ${success ? "#B4E000" : "#F2F4EB"};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    font-size: 32px;
  }
  h1 {
    color: #0D2B31;
    font-size: 22px;
    margin: 0 0 12px;
  }
  p {
    color: #666666;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
  }
  .footer {
    color: rgba(255,255,255,0.5);
    font-size: 12px;
    text-align: center;
    margin-top: 24px;
    max-width: 380px;
  }
</style>
</head>
<body>
  <div>
    <div class="card">
      <div class="icon-circle">${emoji}</div>
      <h1>${title}</h1>
      <p>${message}</p>
    </div>
    <div class="footer">¿Necesitas ayuda? Contacta al equipo de ECO2.</div>
  </div>
</body>
</html>`
}