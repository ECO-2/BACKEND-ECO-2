import "dotenv/config"
import fs from "fs"
import path from "path"
import { prisma } from "@/lib/prisma"

const SPECIES_DIR = path.join(__dirname, "..", "public", "species")

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

async function main() {
  const species = await prisma.plantSpecies.findMany({
    select: { id: true, scientific_name: true, common_name: true, image_url: true },
    orderBy: { common_name: "asc" },
  })

  const files = fs
    .readdirSync(SPECIES_DIR)
    .filter((f) => f.endsWith(".jpg") && !f.endsWith("-thumb.jpg"))

  const fileEntries = files.map((f) => ({
    file: f,
    slug: f.replace(/\.jpg$/, ""),
    norm: normalize(f.replace(/\.jpg$/, "")),
  }))

  const matched: Array<{ id: string; common_name: string; scientific_name: string; file: string; had_image: boolean }> = []
  const unmatchedSpecies: Array<{ common_name: string; scientific_name: string; had_image: boolean }> = []
  const usedFiles = new Set<string>()

  for (const s of species) {
    const normCommon = normalize(s.common_name)
    const normSci = normalize(s.scientific_name)
    const commonParts = s.common_name.split("/").map((p) => normalize(p))
    let hit = fileEntries.find(
      (fe) => !usedFiles.has(fe.file) && (fe.norm === normCommon || fe.norm === normSci || commonParts.includes(fe.norm)),
    )
    if (!hit) {
      hit = fileEntries.find(
        (fe) =>
          !usedFiles.has(fe.file) &&
          (fe.norm.includes(normSci) || normSci.includes(fe.norm) || commonParts.some((p) => fe.norm.includes(p) || p.includes(fe.norm))),
      )
    }
    if (hit) {
      usedFiles.add(hit.file)
      matched.push({ id: s.id, common_name: s.common_name, scientific_name: s.scientific_name, file: hit.file, had_image: !!s.image_url })
    } else {
      unmatchedSpecies.push({ common_name: s.common_name, scientific_name: s.scientific_name, had_image: !!s.image_url })
    }
  }

  const unusedFiles = fileEntries.filter((fe) => !usedFiles.has(fe.file)).map((fe) => fe.file)

  console.log(`Total species: ${species.length}`)
  console.log(`Total image files: ${fileEntries.length}`)
  console.log(`Matched: ${matched.length}`)
  console.log("\n=== MATCHED ===")
  matched.forEach((m) => console.log(`  ${m.common_name}  <-  ${m.file}`))
  console.log("\n=== UNMATCHED SPECIES (no photo found) ===")
  unmatchedSpecies.forEach((s) => console.log(`  ${s.common_name} (${s.scientific_name})`))
  console.log("\n=== UNUSED FILES (no species matched) ===")
  unusedFiles.forEach((f) => console.log(`  ${f}`))

  fs.writeFileSync(
    path.join(__dirname, "species-image-matches.json"),
    JSON.stringify({ matched, unmatchedSpecies, unusedFiles }, null, 2),
  )
  console.log("\nWrote scripts/species-image-matches.json for review")
}

main().finally(() => prisma.$disconnect())
