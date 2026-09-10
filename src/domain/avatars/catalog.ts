/**
 * Catálogo de avatares.
 *
 * Vive en el backend y no solo en la app porque el precio y qué avatares son de
 * pago deciden si una compra es válida: si la app fuera la única que lo sabe,
 * bastaría con editar la petición para llevarse uno gratis.
 */

export interface AvatarItem {
  id: string
  /** Coste en semillas. 0 = incluido con la cuenta. */
  cost: number
}

export const AVATARS: AvatarItem[] = [
  // Incluidos desde el registro.
  { id: "agronoma", cost: 0 },
  { id: "granjero", cost: 0 },
  { id: "tecnologo", cost: 0 },
  { id: "cientifico", cost: 0 },

  // De pago en la tienda de semillas.
  { id: "jardinera", cost: 250 },
  { id: "noctilana", cost: 400 },
  { id: "explorador", cost: 300 },
  { id: "criadora", cost: 350 },
]

export const findAvatar = (id: string): AvatarItem | undefined =>
  AVATARS.find(a => a.id === id)

/** Los que no cuestan semillas: todo el mundo los tiene. */
export const freeAvatarIds = (): string[] =>
  AVATARS.filter(a => a.cost === 0).map(a => a.id)

/**
 * Si el usuario puede ponerse ese avatar.
 *
 * Se comprueba también al guardar el perfil, no solo al comprar: sin esto se
 * podría fijar `avatar_url` a uno de pago sin haberlo comprado nunca.
 */
export const canUseAvatar = (id: string, owned: string[]): boolean => {
  const item = findAvatar(id)
  if (!item) return false
  return item.cost === 0 || owned.includes(id)
}
