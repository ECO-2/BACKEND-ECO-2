import { Resend } from "resend"

/**
 * Cliente de Resend, creado la primera vez que hace falta.
 *
 * Construirlo al importar el modulo lo hacia obligatorio para arrancar: el
 * constructor lanza si no hay clave, y como este fichero cuelga de los
 * servicios de notificaciones, cualquier cosa que los importara moria al
 * cargarse. En CI tumbaba la suite entera, y en produccion habria impedido
 * arrancar la API por no poder mandar correos, que es una funcion secundaria.
 *
 * Ahora la falta de clave solo afecta al envio, y quien llama decide que hacer
 * con ello.
 */
let client: Resend | null = null

export const isEmailConfigured = (): boolean =>
  Boolean(process.env.RESEND_API_KEY)

/** Lanza si no hay clave configurada; usar junto a [isEmailConfigured]. */
export const getResend = (): Resend => {
  if (!client) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error("RESEND_API_KEY no esta configurada")
    client = new Resend(key)
  }
  return client
}
