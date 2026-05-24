import { prisma } from "@/lib/prisma"

export const createUser = async (data: {
  email: string
  password_hash: string | null
  provider?: string
  provider_id?: string | null
}) => {
  return prisma.user.create({
    data: {
      email: data.email,
      password_hash: data.password_hash,
      provider: data.provider ?? "local",
      provider_id: data.provider_id ?? null,
    }
  })
}

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email }
  })
}

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } })
}