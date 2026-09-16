import { prisma } from "@/lib/prisma"
import { notifyUser } from "@/infrastructure/services/notification.service"

export const runRemindersUseCase = async () => {
  const now = new Date()

  // --- Recordatorios de riego (sin cambios) ---
  const overdueTasks = await prisma.userPlantTask.findMany({
    where: {
      next_due_at: { lte: now },
      user_plant: { reminders_muted: false }
    },
    include: {
      user_plant: {
        include: { user: true }
      }
    }
  })

  const taskTypeLabels: Record<string, string> = {
    watering: "regar",
    fertilizing: "fertilizar",
    pruning: "podar",
    repotting: "trasplantar",
    misting: "nebulizar",
    cleaning: "limpiar"
  }

  let sent = 0

  for (const task of overdueTasks) {
    const user = task.user_plant.user
    const currentHour = now.getHours()

    const withinReminderWindow =
      currentHour >= user.reminder_start_hour && currentHour < user.reminder_end_hour

    if (!withinReminderWindow) continue

    const plantName = task.user_plant.nickname ?? "tu planta"
    const action = taskTypeLabels[task.task_type] ?? task.task_type

    const wasSent = await notifyUser(user.id, {
      title: "Tu planta te necesita 🌱",
      body: `Es hora de ${action} ${plantName}.`
    })

    if (wasSent) sent++
  }

  // --- Recordatorio de verificación de email (nuevo) ---
  // No hay ventana horaria propia para esto — se dispara mientras el usuario
  // siga sin verificar y esté dentro de su ventana de recordatorios general.
  const unverifiedUsers = await prisma.user.findMany({
    where: { email_verified: false }
  })

  let verifySent = 0

  for (const user of unverifiedUsers) {
    const currentHour = now.getHours()
    const withinReminderWindow =
      currentHour >= user.reminder_start_hour && currentHour < user.reminder_end_hour

    if (!withinReminderWindow) continue

    const wasSent = await notifyUser(user.id, {
      title: "Verifica tu correo 📧",
      body: "Confirma tu correo y gana 10 semillas de regalo 🌱."
    })

    if (wasSent) verifySent++
  }

  return {
    checked: overdueTasks.length,
    sent,
    unverified_checked: unverifiedUsers.length,
    unverified_reminders_sent: verifySent
  }
}