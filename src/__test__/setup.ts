import { prisma } from "@/lib/prisma"

beforeEach(async () => {
  await prisma.plantIdentification.deleteMany()
  await prisma.userAchievement.deleteMany()
  await prisma.xpLog.deleteMany()
  await prisma.seedTransaction.deleteMany()
  await prisma.userProgress.deleteMany()
  await prisma.achievement.deleteMany()
  await prisma.careLog.deleteMany()
  await prisma.userPlantTask.deleteMany()
  await prisma.userPlant.deleteMany()
  await prisma.room.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.plantSpecies.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})