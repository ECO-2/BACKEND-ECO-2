import { authenticateAdmin } from "@/admin/auth"
import { findUserByEmail } from "@/infrastructure/repositories/user.repository"
import { comparePassword } from "@/utils/hash"

jest.mock("@/infrastructure/repositories/user.repository")
jest.mock("@/utils/hash")

const mockedFindUserByEmail = findUserByEmail as jest.MockedFunction<typeof findUserByEmail>
const mockedComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>

describe("authenticateAdmin", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it("returns null when email or password is missing", async () => {
    expect(await authenticateAdmin(undefined, "secret123")).toBeNull()
    expect(await authenticateAdmin("admin@eco2.com", undefined)).toBeNull()
    expect(mockedFindUserByEmail).not.toHaveBeenCalled()
  })

  it("returns null when no user exists for the given email", async () => {
    mockedFindUserByEmail.mockResolvedValue(null)

    const result = await authenticateAdmin("nobody@eco2.com", "secret123")

    expect(result).toBeNull()
  })

  it("returns null when the user has no password_hash (social-login-only account)", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "u1",
      email: "admin@eco2.com",
      role: "admin",
      password_hash: null,
    } as never)

    const result = await authenticateAdmin("admin@eco2.com", "secret123")

    expect(result).toBeNull()
    expect(mockedComparePassword).not.toHaveBeenCalled()
  })

  it("returns null when the user is not an admin, even with a correct password", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "u1",
      email: "user@eco2.com",
      role: "user",
      password_hash: "hashed",
    } as never)
    mockedComparePassword.mockResolvedValue(true)

    const result = await authenticateAdmin("user@eco2.com", "secret123")

    expect(result).toBeNull()
  })

  it("returns null when the password is incorrect", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "u1",
      email: "admin@eco2.com",
      role: "admin",
      password_hash: "hashed",
    } as never)
    mockedComparePassword.mockResolvedValue(false)

    const result = await authenticateAdmin("admin@eco2.com", "wrong-password")

    expect(result).toBeNull()
  })

  it("returns the admin identity when role is admin and the password matches", async () => {
    mockedFindUserByEmail.mockResolvedValue({
      id: "u1",
      email: "admin@eco2.com",
      role: "admin",
      password_hash: "hashed",
    } as never)
    mockedComparePassword.mockResolvedValue(true)

    const result = await authenticateAdmin("admin@eco2.com", "secret123")

    expect(result).toEqual({ id: "u1", email: "admin@eco2.com" })
  })
})
