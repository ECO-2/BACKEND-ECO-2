import { prisma } from "@/lib/prisma"

export const getAppConfigUseCase = async () => {
  let config = await prisma.appConfig.findUnique({ where: { id: "singleton" } })
  if (!config) {
    config = await prisma.appConfig.create({ data: { id: "singleton" } })
  }
  return config
}