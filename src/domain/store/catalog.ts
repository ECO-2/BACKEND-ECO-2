/**
 * Artículos de la tienda que se canjean con semillas.
 *
 * Vive en el backend por lo mismo que el catálogo de avatares: el precio y lo
 * que entrega cada artículo deciden si el canje es válido. Si solo lo supiera
 * la app, bastaría con editar la petición para llevarse O2+ por una semilla.
 *
 * Solo se listan aquí los artículos que **entregan algo de verdad**. Un
 * artículo sin entrega no debe poder comprarse: cobrar sin dar nada es
 * exactamente el fallo que trajo esto aquí.
 */

export interface StoreItem {
  id: string
  /** Coste en semillas. */
  cost: number
  /** Días de O2+ que concede, si el artículo es una suscripción. */
  plusDays?: number
  /** Macetas extra permanentes. */
  slots?: number
  /** Macetas extra temporales, y cuántos días duran. */
  rentalSlots?: number
  rentalDays?: number
}

export const STORE_ITEMS: StoreItem[] = [
  { id: "o2_plus_2w", cost: 3500, plusDays: 14 },
  { id: "o2_plus_4w", cost: 6000, plusDays: 28 },
  { id: "maceta_pack3", cost: 1000, slots: 3 },
  { id: "maceta_rental_2w", cost: 150, rentalSlots: 1, rentalDays: 14 },
]

export const findStoreItem = (id: string): StoreItem | undefined =>
  STORE_ITEMS.find(i => i.id === id)
