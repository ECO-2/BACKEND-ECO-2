import type {
  BaseResource as BaseResourceClass,
  BaseProperty as BasePropertyClass,
  BaseRecord as BaseRecordClass,
  Filter,
  PropertyType,
} from "adminjs"

/**
 * Minimal custom AdminJS resource adapter for Prisma models.
 *
 * Why not `@adminjs/prisma`: that package's peer dependency caps out at
 * `@prisma/client ^5 || ^6`, and this project runs Prisma 7 (a brand new
 * major with a different generated-client shape). Rather than depend on an
 * adapter that isn't validated against our Prisma version, this talks to
 * the standard Prisma Client CRUD methods directly (findMany/count/create/
 * update/delete), which are stable across Prisma majors. Fields are
 * declared explicitly per resource instead of introspected from Prisma's
 * DMMF, which is more verbose but immune to DMMF shape changes.
 */

export interface PrismaFieldConfig {
  path: string
  type?: PropertyType
  isId?: boolean
  isSortable?: boolean
  isRequired?: boolean
  availableValues?: string[]
  /** Never sent back to Prisma on create/update (relations, computed/DB-generated fields). */
  readOnly?: boolean
}

export interface AdminJsRuntime {
  BaseResource: typeof BaseResourceClass
  BaseProperty: typeof BasePropertyClass
  BaseRecord: typeof BaseRecordClass
}

// Prisma's generated per-model delegates type their args as precise,
// mutually-exclusive-key interfaces (no index signature), which a generic
// `Record<string, unknown>` argument can't satisfy structurally even though
// the shapes are compatible at runtime. `any` here is intentional: this
// interface exists specifically to erase each model's distinct generic
// delegate type behind one shape this adapter can call generically.
export interface PrismaModelDelegate {
  findMany: (args?: any) => Promise<Record<string, unknown>[]>
  findUnique: (args: any) => Promise<Record<string, unknown> | null>
  count: (args?: any) => Promise<number>
  create: (args: any) => Promise<Record<string, unknown>>
  update: (args: any) => Promise<Record<string, unknown>>
  delete: (args: any) => Promise<Record<string, unknown>>
}

export interface PrismaResourceConfig {
  resourceId: string
  model: PrismaModelDelegate
  fields: PrismaFieldConfig[]
}

const coerceValue = (rawValue: unknown, type: PropertyType | undefined): unknown => {
  if (rawValue === "" || rawValue === undefined) return null
  if (rawValue === null) return null
  switch (type) {
    case "number":
    case "float":
      return Number(rawValue)
    case "boolean":
      return typeof rawValue === "boolean" ? rawValue : rawValue === "true"
    case "date":
    case "datetime":
      return new Date(rawValue as string)
    default:
      return rawValue
  }
}

export function createPrismaResourceClass({ BaseResource, BaseProperty, BaseRecord }: AdminJsRuntime) {
  class PrismaProperty extends BaseProperty {
    private fieldConfig: PrismaFieldConfig

    constructor(config: PrismaFieldConfig, position: number) {
      super({
        path: config.path,
        type: config.type ?? "string",
        isId: config.isId ?? false,
        isSortable: config.isSortable ?? true,
        position,
      })
      this.fieldConfig = config
    }

    override isRequired(): boolean {
      return this.fieldConfig.isRequired ?? false
    }

    override availableValues(): string[] | null {
      return this.fieldConfig.availableValues ?? null
    }
  }

  return class PrismaResource extends BaseResource {
    private config: PrismaResourceConfig

    private propertyInstances: PrismaProperty[]

    constructor(config: PrismaResourceConfig) {
      super(config)
      this.config = config
      this.propertyInstances = config.fields.map((field, index) => new PrismaProperty(field, index + 1))
    }

    databaseName(): string {
      return "PostgreSQL"
    }

    databaseType(): string {
      return "postgresql"
    }

    id(): string {
      return this.config.resourceId
    }

    properties() {
      return this.propertyInstances
    }

    property(path: string) {
      return this.propertyInstances.find((prop) => prop.path() === path) ?? null
    }

    private idField(): string {
      return this.config.fields.find((field) => field.isId)?.path ?? "id"
    }

    private buildWhere(filter: Filter): Record<string, unknown> {
      const where: Record<string, unknown> = {}
      Object.values(filter.filters ?? {}).forEach((element) => {
        const { path, property, value } = element
        if (value === undefined || value === null) return
        if (typeof value === "object" && ("from" in value || "to" in value)) {
          const range: Record<string, unknown> = {}
          if (value.from) range.gte = coerceValue(value.from, property.type())
          if (value.to) range.lte = coerceValue(value.to, property.type())
          where[path] = range
          return
        }
        if (property.type() === "string") {
          where[path] = { contains: value, mode: "insensitive" }
        } else {
          where[path] = coerceValue(value, property.type())
        }
      })
      return where
    }

    async count(filter: Filter): Promise<number> {
      return this.config.model.count({ where: this.buildWhere(filter) })
    }

    async find(
      filter: Filter,
      options: { limit?: number; offset?: number; sort?: { sortBy?: string; direction?: "asc" | "desc" } },
    ) {
      const rows = await this.config.model.findMany({
        where: this.buildWhere(filter),
        take: options.limit,
        skip: options.offset,
        orderBy: options.sort?.sortBy
          ? { [options.sort.sortBy]: options.sort.direction ?? "asc" }
          : undefined,
      })
      return rows.map((row) => new BaseRecord(row, this))
    }

    async findOne(id: string) {
      const row = await this.config.model.findUnique({ where: { [this.idField()]: id } })
      return row ? new BaseRecord(row, this) : null
    }

    async findMany(ids: Array<string | number>) {
      const rows = await this.config.model.findMany({ where: { [this.idField()]: { in: ids } } })
      return rows.map((row) => new BaseRecord(row, this))
    }

    build(params: Record<string, unknown>) {
      return new BaseRecord(params, this)
    }

    private sanitize(params: Record<string, unknown>): Record<string, unknown> {
      const data: Record<string, unknown> = {}
      this.config.fields.forEach((field) => {
        if (field.isId || field.readOnly) return
        if (!(field.path in params)) return
        data[field.path] = coerceValue(params[field.path], field.type)
      })
      return data
    }

    async create(params: Record<string, unknown>) {
      return this.config.model.create({ data: this.sanitize(params) })
    }

    async update(id: string, params: Record<string, unknown>) {
      return this.config.model.update({
        where: { [this.idField()]: id },
        data: this.sanitize(params),
      })
    }

    async delete(id: string): Promise<void> {
      await this.config.model.delete({ where: { [this.idField()]: id } })
    }
  }
}

export type PrismaResourceClass = ReturnType<typeof createPrismaResourceClass>
