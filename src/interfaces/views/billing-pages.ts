export const renderBillingPage = (title: string, message: string) => `<!doctype html>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ECO2</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #1F2A2E; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #ffffff; padding: 48px 32px; border-radius: 16px; text-align: center; max-width: 380px; width: 100%; box-shadow: 0 8px 30px rgba(0,0,0,0.25); }
    .icon-circle { width: 72px; height: 72px; border-radius: 50%; background-color: #B4E000; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; }
    h1 { color: #0D2B31; font-size: 22px; margin: 0 0 12px; }
    p { color: #666666; font-size: 14px; line-height: 1.6; margin: 0; }
    .footer { color: rgba(255,255,255,0.5); font-size: 12px; text-align: center; margin-top: 24px; max-width: 380px; }
  </style>
</head>
<body>
  <div>
    <main class="card">
      <div class="icon-circle">🍀</div>
      <h1>${title}</h1>
      <p>${message}</p>
    </main>
    <div class="footer">¿Necesitas ayuda? Contacta al equipo de ECO2.</div>
  </div>
</body>
</html>`