import type { Express } from "express"
import path from "path"
import { createPrismaResourceClass } from "./adapters/prisma-resource"
import { userResourceConfig } from "./resources/user.resource"
import { sessionResourceConfig } from "./resources/session.resource"
import { plantSpeciesResourceConfig } from "./resources/plant-species.resource"
import { roomResourceConfig } from "./resources/room.resource"
import { userPlantResourceConfig } from "./resources/user-plant.resource"
import { userPlantTaskResourceConfig } from "./resources/user-plant-task.resource"
import { careLogResourceConfig } from "./resources/care-log.resource"
import { plantIdentificationResourceConfig } from "./resources/plant-identification.resource"
import { achievementResourceConfig } from "./resources/achievement.resource"
import { userAchievementResourceConfig } from "./resources/user-achievement.resource"
import { userProgressResourceConfig } from "./resources/user-progress.resource"
import { xpLogResourceConfig } from "./resources/xp-log.resource"
import { seedTransactionResourceConfig } from "./resources/seed-transaction.resource"
import { deviceTokenResourceConfig } from "./resources/device-token.resource"
import { authenticateAdmin } from "./auth"
import { SPECIES_DIR, resizeSpeciesPhoto } from "./resize-species-photo"

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
  const { default: AdminJS, BaseResource, BaseProperty, BaseRecord, ComponentLoader, Router: AdminRouter } =
    await dynamicImport<typeof import("adminjs")>("adminjs")
  const { default: AdminJSExpress } = await dynamicImport<typeof import("@adminjs/express")>(
    "@adminjs/express",
  )
  const { default: uploadFileFeature } = await dynamicImport<typeof import("@adminjs/upload")>(
    "@adminjs/upload",
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

  const nav = (name: string) => ({ navigation: { name, icon: "Database" } })

  const componentLoader = new ComponentLoader()

  const Components = {
    Dashboard: componentLoader.add("Dashboard", "./components/dashboard"),
  }

  // Lets an admin drop a photo straight into the PlantSpecies edit/new form
  // (a "Foto" field appears there) instead of running a script by hand.
  // Storage is local disk (public/species/, already served by
  // express.static) — no Cloudinary/Firebase/S3 account needed. The raw
  // upload is written under `image_key`; resizeSpeciesPhoto (an `after`
  // hook chained right after this feature's own hook) turns it into the
  // actual image_url/thumbnail_url the app reads.
  const speciesPhotoUpload = uploadFileFeature({
    componentLoader,
    provider: { local: { bucket: SPECIES_DIR, opts: {} } },
    properties: { key: "image_key", file: "photo" },
    validation: { mimeTypes: ["image/jpeg", "image/png", "image/webp"], maxSize: 8 * 1024 * 1024 },
  })

  const admin = new AdminJS({
    rootPath: ADMIN_ROOT_PATH,
    componentLoader,
    assets: {
      styles: ["/admin-custom.css"],
    },
    dashboard: {
      component: Components.Dashboard,
    },
    resources: [
      // Users and accounts
      { resource: new PrismaResource(userResourceConfig), options: nav("Users & Accounts") },
      { resource: new PrismaResource(sessionResourceConfig), options: nav("Users & Accounts") },
      { resource: new PrismaResource(deviceTokenResourceConfig), options: nav("Users & Accounts") },

      // Plants and garden
      {
        resource: new PrismaResource(plantSpeciesResourceConfig),
        options: {
          ...nav("Plants & Garden"),
          properties: {
            image_key: { isVisible: false },
            image_url: { isVisible: true, label: "Photo (URL)" },
            thumbnail_url: { isVisible: true, label: "Thumbnail (URL)" },
          },
          actions: {
            new: { after: resizeSpeciesPhoto },
            edit: { after: resizeSpeciesPhoto },
          },
        },
        features: [speciesPhotoUpload],
      },
      { resource: new PrismaResource(roomResourceConfig), options: nav("Plants & Garden") },
      { resource: new PrismaResource(userPlantResourceConfig), options: nav("Plants & Garden") },
      { resource: new PrismaResource(userPlantTaskResourceConfig), options: nav("Plants & Garden") },
      { resource: new PrismaResource(careLogResourceConfig), options: nav("Plants & Garden") },
      { resource: new PrismaResource(plantIdentificationResourceConfig), options: nav("Plants & Garden") },

      // Gamification
      { resource: new PrismaResource(achievementResourceConfig), options: nav("Gamification") },
      { resource: new PrismaResource(userAchievementResourceConfig), options: nav("Gamification") },
      { resource: new PrismaResource(userProgressResourceConfig), options: nav("Gamification") },
      { resource: new PrismaResource(xpLogResourceConfig), options: nav("Gamification") },
      { resource: new PrismaResource(seedTransactionResourceConfig), options: nav("Gamification") },
    ],
    branding: {
      companyName: "ECO2 Backoffice",
      withMadeWithLove: false,
      favicon: '/icono.png',
      logo: "/logo2.png",
      theme: {
        colors: {
          primary100: "#0D2B31",
          primary80: "#10454F",
          grey40: "#10454F",
          primary60: "#8A9A65",
          primary20: "#F2F4EB",
          accent: "#B4E000",
          bg: "#ccc9b3",
          grey20: "#ccc9b3",
          grey60: "#1c1c1a",
          container: "#ccc9b3",
          inputBorder: "#000000",
        },  
        borders: {
          bg: "1px solid #ccc9b3",
          default: "1px solid #ccc9b3",
        }
      }, 

    },
    locale: {
      language: "en",
      translations: {
        en: {
          components: {
            Login: {
              welcomeHeader: "Welcome",
              welcomeMessage: "Backoffice for the ECO2 plant-care platform. Manage species, users, care plans, and gamification data in one place."
            }
          }
        }
      }
    }
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
    // Lets a field genuinely accept more than one file at once if a future
    // resource needs it. Doesn't affect the single-file PlantSpecies photo
    // upload above — see the big comment in resize-species-photo.ts for why
    // that one can't rely on @adminjs/upload's own file-handling hook.
    { multiples: true },
  )

  await admin.watch()

  app.use(admin.options.rootPath, router)
}
