import { prisma } from "@/lib/prisma"

beforeEach(async () => {
  await prisma.userPlant.deleteMany()
  await prisma.room.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.plantSpecies.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})