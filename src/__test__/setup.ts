import { prisma } from "@/lib/prisma"

beforeEach(async () => {
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})