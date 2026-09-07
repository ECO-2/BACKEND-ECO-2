import { prisma } from "@/lib/prisma"
import { notifyUser } from "@/infrastructure/services/notification.service"

export const runRemindersUseCase = async () => {
  const now = new Date()

  const overdueTasks = await prisma.userPlantTask.findMany({
    // Se excluyen las plantas silenciadas aqui, en la consulta, y no al
    // enviar: asi no cuentan siquiera como "revisadas".
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

  return { checked: overdueTasks.length, sent }
}