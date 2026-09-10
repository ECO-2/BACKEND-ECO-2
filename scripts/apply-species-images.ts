import "dotenv/config"
import fs from "fs"
import path from "path"
import { prisma } from "@/lib/prisma"

// Base URL where /public is served. The backend already does
// `app.use(express.static('public'))`, so any file placed in
// public/species/ is reachable at BASE_URL/species/<file> — no third-party
// image host (Cloudinary, Firebase Storage, etc.) required.
//
// Override with IMAGE_BASE_URL=http://localhost:3000 for a purely local
// smoke test; defaults to the real production backend so the URLs stored
// are the ones the app will actually use.
const BASE_URL = process.env.IMAGE_BASE_URL || "https://eco2-api-c9e4hfh7h3cfesg3.eastus-01.azurewebsites.net"

// Manual overrides for the 4 files whose names didn't auto-match the
// catalog entry (typos / extra words in the source filenames) — verified
// by hand against prisma/seed.ts. "Sábila de Barbados" (Aloe barbadensis)
// has no photo among the supplied files and is intentionally left out.
const MANUAL: Record<string, string> = {
  "Calatea Medallón": "calatea-de-medallon.jpg",
  "Helecho Boston / Helecho Espada": "helecho-de-boston.jpg",
  "Miramelinda / Impatiens": "miarmelinda.jpg",
  "Tradescantia / Amor de Hombre": "trasdencantia.jpg",
}

async function main() {
  const matchesPath = path.join(__dirname, "species-image-matches.json")
  const { matched } = JSON.parse(fs.readFileSync(matchesPath, "utf-8")) as {
    matched: Array<{ id: string; common_name: string; file: string }>
  }

  const all = [...matched]
  for (const [common_name, file] of Object.entries(MANUAL)) {
    const species = await prisma.plantSpecies.findFirst({ where: { common_name } })
    if (!species) {
      console.warn(`  ! No se encontró la especie "${common_name}" en el catálogo, se omite`)
      continue
    }
    all.push({ id: species.id, common_name, file })
  }

  let updated = 0
  for (const m of all) {
    const image_url = `${BASE_URL}/species/${m.file}`
    const thumbnail_url = `${BASE_URL}/species/${m.file.replace(/\.jpg$/, "-thumb.jpg")}`
    await prisma.plantSpecies.update({
      where: { id: m.id },
      data: { image_url, thumbnail_url },
    })
    updated++
    console.log(`  ${m.common_name} -> ${image_url}`)
  }

  console.log(`\n${updated} especies actualizadas con image_url/thumbnail_url reales.`)
}

main().finally(() => prisma.$disconnect())
