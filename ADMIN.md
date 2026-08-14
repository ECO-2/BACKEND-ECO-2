# Backoffice (ECO2 Admin)

Panel de administración montado en `/admin`, para gestionar el catálogo de
plantas (`PlantSpecies`), usuarios y logros directamente sobre la base de
datos existente — sin backend/servicio separado.

## Por qué AdminJS y no Django

Se evaluó Django (propuesto inicialmente) y se descartó para este proyecto
específico:

- El backend es Node.js + Express + **Prisma** + TypeScript. Django solo
  aporta valor real cuando es dueño del ORM/migraciones; aquí el schema ya
  lo gestiona Prisma. Poner Django sobre la misma base de datos implica dos
  sistemas de migraciones compitiendo por el mismo schema.
- Sumaría un tercer lenguaje/runtime a desplegar y mantener, para un equipo
  de 4 personas que ya opera Flutter/Dart + Node/TS.
- El JWT (RS256) ya incluye el claim `role`, y `User.role` ya existe en el
  schema — lo único que faltaba era la UI de administración en sí.

**AdminJS** se monta directo sobre el Express/Prisma existentes: mismo
lenguaje, mismo cliente de base de datos, mismo sistema de auth (reutiliza
`User.password_hash` + bcrypt + `role`), cero infraestructura nueva.

## Detalle técnico importante: adaptador de Prisma personalizado

El paquete oficial `@adminjs/prisma` solo soporta `@prisma/client` 5.x/6.x
vía `peerDependency`. Este proyecto usa **Prisma 7**, que trae un generador
de cliente nuevo — usar ese paquete habría sido apostar a una integración no
validada contra nuestra versión.

En su lugar, `src/admin/adapters/prisma-resource.ts` implementa un adaptador
`BaseResource` de AdminJS **propio y genérico**, que llama directamente a
los métodos estándar del cliente de Prisma (`findMany`, `count`, `create`,
`update`, `delete` — estables entre versiones mayores de Prisma) en vez de
depender de la introspección interna (DMMF) de un paquete de terceros. Cada
recurso (`src/admin/resources/*.ts`) declara sus campos explícitamente en
vez de auto-generarlos — más verboso, pero inmune a cambios internos de
Prisma.

`adminjs` y `@adminjs/express` además son paquetes **ESM-only**, mientras
este backend compila a CommonJS. `src/admin/index.ts` los carga con un
`import()` dinámico "envuelto" en `new Function(...)` para evitar que
TypeScript lo "downlevee" a `require()` (que fallaría con `ERR_REQUIRE_ESM`
en el Node 20 que usa CI — ver comentario en ese archivo antes de tocarlo).

## Variables de entorno

Además de las que ya usa la API (`DATABASE_URL`, `JWT_*`, etc.), agregar:

```
ADMIN_COOKIE_SECRET=<string aleatorio largo>
ADMIN_SESSION_SECRET=<otro string aleatorio largo>
```

Si no están seteadas, el servidor arranca igual (con un secreto de
desarrollo inseguro) pero imprime un warning — **no desplegar así a
producción**.

## Crear el primer usuario admin

No hay UI para esto todavía (evita el problema del huevo y la gallina). Vía
Prisma Studio o SQL directo:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'tu-correo@eco2.com';
```

El login del panel (`/admin/login`) usa las mismas credenciales que ya
tiene ese usuario en la app (mismo `password_hash`).

## Correr localmente

```bash
npm install
npm run dev
```

Visitar `http://localhost:3000/admin`.

## Recursos incluidos (v1)

- **User** — sin `password_hash`/`reset_token_hash` expuestos (nunca se
  muestra ni edita un hash de contraseña desde un backoffice).
- **PlantSpecies** — incluye los nuevos campos `image_url` /
  `thumbnail_url` (ver siguiente sección).
- **Achievement**.

Se puede sumar cualquier otro modelo instanciando `PrismaResource` con su
propia lista de campos (ver los `*.resource.ts` existentes como plantilla).

## Imágenes de especies (`image_url` / `thumbnail_url`)

La base de datos nunca tuvo campo de imagen — se agregó en esta rama
(`prisma/migrations/20260808120000_add_plant_species_images`). Por ahora
son campos de texto simples: el flujo es subir la foto a un storage externo
y pegar la URL resultante aquí.

Recomendación para cuando se carguen imágenes reales:

1. **Storage**: Firebase Storage (el proyecto ya tiene `firebase-admin`
   configurado, hoy solo para login social — mismo proyecto de Firebase,
   sin credenciales nuevas) o Azure Blob + CDN (ya están en Azure). Nunca
   guardar el binario en Postgres.
2. **Formato**: WebP (o AVIF), no JPEG/PNG — 25-35% más liviano a igual
   calidad visual.
3. **Dos tamaños por foto**: una miniatura (~200px, `thumbnail_url`, para
   tarjetas de catálogo) y una versión mediana (~600px, `image_url`, para
   el detalle). Se genera una sola vez al subir (p. ej. con `sharp`), no en
   cada request.
4. **Origen de las fotos**: necesitan licencia de uso (banco de imágenes
   pagado/con licencia adecuada, o fotos propias) — nadie debería pegar
   URLs de fotos con derechos de autor de terceros sin verificar la
   licencia.

Del lado de Flutter, el equipo de frontend ya dejó preparado el ícono de
categoría (tropical/suculenta/cactus/etc.) como *fallback* visual — en
cuanto estos campos tengan datos reales, sólo hace falta cablear
`cached_network_image` para que se muestren, sin tocar el resto de la UI.

## Limitaciones conocidas (v1)

- Sin subida de archivos desde el panel — se pega una URL ya subida a otro
  lado. Se puede agregar más adelante como una AdminJS "Action" personalizada
  usando `express-formidable` (ya está instalado como dependencia).
- Sin acción para resetear contraseñas de usuarios desde el panel (fuera de
  alcance de esta primera versión).
- No se pudo correr contra una base de datos real durante el desarrollo de
  esta rama (sin credenciales locales) — validado con `tsc --noEmit`, build
  completo, y un smoke test manual que confirma que `/admin/login` renderiza
  y que las rutas protegidas redirigen correctamente sin sesión. Probar
  contra la base de datos real (crear/editar/borrar un `PlantSpecies` de
  prueba) antes de usar esto en producción.
