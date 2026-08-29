import { prisma } from "@/lib/prisma"
import { notifyUser } from "@/infrastructure/services/notification.service"

export const runRemindersUseCase = async () => {
  const now = new Date()

  const overdueTasks = await prisma.userPlantTask.findMany({
    where: { next_due_at: { lte: now } },
    include: {
      user_plant: {
        include: { user: true }
      }
    }
  })

  let sent = 0

  for (const task of overdueTasks) {
    const user = task.user_plant.user
    const currentHour = now.getHours()

    const withinReminderWindow =
      currentHour >= user.reminder_start_hour && currentHour < user.reminder_end_hour

    if (!withinReminderWindow) continue

    const wasSent = await notifyUser(user.id, {
      title: "Tu planta te necesita 🌱",
      body: `Es hora de ${task.task_type} tu planta.`
    })

    if (wasSent) sent++
  }

  return { checked: overdueTasks.length, sent }
}