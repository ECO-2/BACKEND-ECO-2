import fs from "fs"
import path from "path"
import sharp from "sharp"
import type { ActionContext, ActionRequest, RecordActionResponse } from "adminjs"
import { prisma } from "@/lib/prisma"

export const SPECIES_DIR = path.resolve(__dirname, "..", "..", "public", "species")

// Same base URL convention as scripts/apply-species-images.ts — the backend
// serves /public itself (express.static), so this is the only URL that ever
// needs to exist. No Cloudinary/Firebase/S3 account required.
const BASE_URL = process.env.IMAGE_BASE_URL || "https://eco2-api-c9e4hfh7h3cfesg3.eastus-01.azurewebsites.net"

// Must match @adminjs/upload's own CONTEXT_NAMESPACE (src/features/
// upload-file/constants.ts) — that's where its `before` hook stashes the
// raw uploaded file before stripping it out of the payload.
const UPLOAD_CONTEXT_NAMESPACE = "adminjs-upload"

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/**
 * `after` hook for the PlantSpecies "new"/"edit" actions.
 *
 * We do NOT rely on @adminjs/upload's own `updateRecord` hook to have
 * written the file: the installed @adminjs/express pulls in the ancient,
 * abandoned `express-formidable@1.2.0`, whose bundled formidable v1 only
 * wraps a field in an array once a *second* file arrives under the same
 * name — a lone upload (our case) stays a bare object, so `updateRecord`'s
 * `files.length` check is always falsy and it silently no-ops. Instead we
 * read the raw file straight out of the context namespace @adminjs/upload's
 * own `before` hook already stashed it in (same file, same temp path —
 * we just don't depend on its buggy array assumption to use it) and do the
 * upload ourselves: resize into the two files the app actually reads
 * (image_url/thumbnail_url), named after the species so a re-upload cleanly
 * replaces the previous photo instead of accumulating orphans.
 */
export async function resizeSpeciesPhoto(
  response: RecordActionResponse,
  request: ActionRequest,
  context: ActionContext,
): Promise<RecordActionResponse> {
  if (request.method !== "post") return response

  const record = context.record
  if (!record) return response

  const namespace = (context as unknown as Record<string, Record<string, unknown>>)[UPLOAD_CONTEXT_NAMESPACE]
  const rawUpload = namespace?.photo as { path?: string } | Array<{ path?: string }> | undefined
  const file = Array.isArray(rawUpload) ? rawUpload[0] : rawUpload
  if (!file?.path || !fs.existsSync(file.path)) return response

  const id = record.params.id as string
  const scientificName = record.params.scientific_name as string
  const slug = slugify(scientificName) || id
  const fullFile = `${slug}.jpg`
  const thumbFile = `${slug}-thumb.jpg`
  const fullPath = path.join(SPECIES_DIR, fullFile)
  const thumbPath = path.join(SPECIES_DIR, thumbFile)

  const image = sharp(file.path).rotate()
  await image.clone().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78 }).toFile(fullPath)
  await image.clone().resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 72 }).toFile(thumbPath)

  fs.unlink(file.path, () => {})

  const image_url = `${BASE_URL}/species/${fullFile}`
  const thumbnail_url = `${BASE_URL}/species/${thumbFile}`

  await prisma.plantSpecies.update({ where: { id }, data: { image_url, thumbnail_url, image_key: null } })

  return {
    ...response,
    record: {
      ...response.record,
      params: { ...response.record.params, image_url, thumbnail_url, image_key: null },
    },
  }
}
