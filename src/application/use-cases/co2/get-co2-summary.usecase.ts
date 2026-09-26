import { prisma } from "@/lib/prisma"

export const getCo2SummaryUseCase = async (userId: string) => {
  const latest = await prisma.co2Reading.findFirst({
    where: { user_id: userId },
    orderBy: { recorded_at: "desc" }
  })

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const readings = await prisma.co2Reading.findMany({
    where: { user_id: userId, recorded_at: { gte: sevenDaysAgo } },
    orderBy: { recorded_at: "asc" }
  })

  const byDay = new Map<string, { sum: number; count: number }>()
  for (const r of readings) {
    const day = r.recorded_at.toISOString().slice(0, 10)
    const entry = byDay.get(day) ?? { sum: 0, count: 0 }
    entry.sum += r.co2_ppm
    entry.count += 1
    byDay.set(day, entry)
  }

  const last7Days = Array.from(byDay.entries()).map(([date, { sum, count }]) => ({
    date,
    avg_ppm: Math.round(sum / count)
  }))

  return {
    current_ppm: latest?.co2_ppm ?? null,
    recorded_at: latest?.recorded_at ?? null,
    last7Days
  }
}