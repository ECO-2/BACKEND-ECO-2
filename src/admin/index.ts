import type { Express } from "express"
import path from "path"
import { createPrismaResourceClass } from "./adapters/prisma-resource"
import { userResourceConfig } from "./resources/user.resource"
import { plantSpeciesResourceConfig } from "./resources/plant-species.resource"
import { achievementResourceConfig } from "./resources/achievement.resource"
import { authenticateAdmin } from "./auth"

const ADMIN_ROOT_PATH = "/admin"
const DEV_ONLY_FALLBACK_SECRET = "dev-only-insecure-secret-change-me"

// `adminjs` and `@adminjs/express` ship as ESM-only packages (`"type":
// "module"` in their package.json), while this backend compiles to
// CommonJS. The obvious fix — `await import("adminjs")` — does NOT work:
// under `module: "commonjs"`, tsc downlevels dynamic `import()` into
// `Promise.resolve().then(() => require("adminjs"))`, which still throws
// `ERR_REQUIRE_ESM` at runtime. (Newer Node versions can `require()` an ESM
// module directly, but our CI/deploy target is Node 20 — see
// .github/workflows/test.yml — and that support isn't guaranteed there.)
//
// Wrapping the import specifier in `new Function(...)` hides the
// `import()` call from tsc's static analysis, so it's emitted as a real,
// un-downleveled dynamic import that Node executes natively. This is the
// standard workaround for consuming ESM-only packages from a CommonJS
// TypeScript project. Do not "simplify" this back to `await import(...)`.
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function("specifier", "return import(specifier)") as <T = unknown>(
  specifier: string,
) => Promise<T>

/**
 * Mounts the ECO2 backoffice at /admin.
 *
 * This is called from server.ts (awaited before the app starts listening),
 * not from app.ts, so importing the plain Express `app` for tests
 * (supertest) doesn't pay the cost of loading AdminJS at all.
 */
export async function mountAdmin(app: Express): Promise<void> {
  const { default: AdminJS, BaseResource, BaseProperty, BaseRecord, Router: AdminRouter } =
    await dynamicImport<typeof import("adminjs")>("adminjs")
  const { default: AdminJSExpress } = await dynamicImport<typeof import("@adminjs/express")>(
    "@adminjs/express",
  )

  // @adminjs/express sirve estos bundles con `res.sendFile(asset.src)` sin
  // `{ dotfiles: "allow" }`. `send` (la lib que usa Express por debajo)
  // bloquea por defecto CUALQUIER archivo cuya ruta pase por una carpeta
  // que empiece con "." (protección genérica anti-".env"/".git"), y eso
  // incluye rutas de checkout perfectamente normales como
  // C:\Users\<usuario>\...\.algo\... — no es un caso raro. Sin esto el
  // login del panel queda en blanco ("createRoot is not defined") porque
  // los bundles nunca llegan a cargar. Se registra ANTES del router de
  // AdminJS para interceptar esas rutas primero.
  for (const asset of AdminRouter.assets) {
    app.get(`${ADMIN_ROOT_PATH}${asset.path}`, (_req, res) => {
      res.sendFile(path.resolve(asset.src), { dotfiles: "allow" }, (err) => {
        if (err) res.status(404).end()
      })
    })
  }

  const PrismaResource = createPrismaResourceClass({ BaseResource, BaseProperty, BaseRecord })

  const admin = new AdminJS({
    rootPath: ADMIN_ROOT_PATH,
    resources: [
      { resource: new PrismaResource(userResourceConfig) },
      { resource: new PrismaResource(plantSpeciesResourceConfig) },
      { resource: new PrismaResource(achievementResourceConfig) },
    ],
    branding: {
      companyName: "ECO2 Backoffice",
      withMadeWithLove: false,
    },
  })

  const cookiePassword = process.env.ADMIN_COOKIE_SECRET
  const sessionSecret = process.env.ADMIN_SESSION_SECRET
  if (!cookiePassword || !sessionSecret) {
    // eslint-disable-next-line no-console
    console.warn(
      "[admin] ADMIN_COOKIE_SECRET / ADMIN_SESSION_SECRET are not set. " +
        "Falling back to an insecure development-only secret — set both " +
        "env vars before deploying this to a shared/production environment.",
    )
  }

  const router = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: authenticateAdmin,
      cookieName: "eco2-admin",
      cookiePassword: cookiePassword ?? DEV_ONLY_FALLBACK_SECRET,
      maxRetries: { count: 5, duration: 60 },
    },
    null,
    {
      secret: sessionSecret ?? DEV_ONLY_FALLBACK_SECRET,
      resave: false,
      saveUninitialized: true,
    },
  )

  app.use(admin.options.rootPath, router)
}
