/**
 * Curva de niveles de ECO2.
 *
 * Antes el XP se acumulaba hacia nada: `level` era un campo que solo cambiaba
 * si alguien lo editaba a mano en el backoffice, así que todos los usuarios se
 * quedaban en Nivel 1 por muchos cuidados que registraran. Las pantallas de
 * Perfil y Ajustes disimulaban el problema mostrando "Nivel 2 · Brote" escrito
 * a mano.
 *
 * Umbrales acumulativos. Se eligen para que los primeros niveles lleguen
 * rápido (el onboarding ya da 50 XP y añadir una planta 15) y luego se abran:
 * subir de nivel tiene que seguir siendo alcanzable cuidando plantas de
 * verdad, no un número decorativo.
 */
export interface Level {
  level: number
  name: string
  minXp: number
}

export const LEVELS: Level[] = [
  { level: 1, name: "Semilla", minXp: 0 },
  { level: 2, name: "Brote", minXp: 100 },
  { level: 3, name: "Retoño", minXp: 300 },
  { level: 4, name: "Planta", minXp: 600 },
  { level: 5, name: "Frondosa", minXp: 1000 },
  { level: 6, name: "Guardiana", minXp: 1600 },
  { level: 7, name: "Botánica", minXp: 2500 },
  { level: 8, name: "Maestra", minXp: 4000 },
  { level: 9, name: "Leyenda", minXp: 6000 },
  { level: 10, name: "Ancestral", minXp: 9000 }
]

/** Nivel que corresponde a una cantidad de XP. */
export const levelForXp = (xp: number): Level => {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.minXp) current = l
    else break
  }
  return current
}

/**
 * Progreso dentro del nivel actual, para poder pintar una barra honesta.
 * En el último nivel no hay siguiente umbral: se devuelve progreso completo
 * en vez de dividir por un infinito imaginario.
 */
export const levelProgress = (xp: number) => {
  const current = levelForXp(xp)
  const next = LEVELS.find(l => l.level === current.level + 1)

  if (!next) {
    return {
      level: current.level,
      name: current.name,
      xp,
      xp_into_level: xp - current.minXp,
      xp_for_next: null,
      next_level_name: null,
      progress: 1
    }
  }

  const span = next.minXp - current.minXp
  return {
    level: current.level,
    name: current.name,
    xp,
    xp_into_level: xp - current.minXp,
    xp_for_next: next.minXp - xp,
    next_level_name: next.name,
    progress: span === 0 ? 1 : (xp - current.minXp) / span
  }
}
