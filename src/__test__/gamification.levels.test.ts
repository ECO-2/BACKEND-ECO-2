import { levelForXp, levelProgress, LEVELS } from "@/domain/gamification/levels"

describe("Curva de niveles", () => {
  it("empieza en Semilla con 0 XP", () => {
    expect(levelForXp(0).level).toBe(1)
    expect(levelForXp(0).name).toBe("Semilla")
  })

  it("sube de nivel justo al alcanzar el umbral, no antes", () => {
    expect(levelForXp(99).level).toBe(1)
    expect(levelForXp(100).level).toBe(2)
    expect(levelForXp(299).level).toBe(2)
    expect(levelForXp(300).level).toBe(3)
  })

  it("no se pasa del último nivel por mucho XP que se acumule", () => {
    const last = LEVELS[LEVELS.length - 1]
    expect(levelForXp(999999).level).toBe(last.level)
  })

  it("los umbrales son estrictamente crecientes", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXp).toBeGreaterThan(LEVELS[i - 1].minXp)
    }
  })

  describe("progreso dentro del nivel", () => {
    it("es 0 justo al entrar en un nivel y cercano a 1 antes del siguiente", () => {
      expect(levelProgress(100).progress).toBe(0)
      expect(levelProgress(299).progress).toBeGreaterThan(0.9)
    })

    it("indica cuánto XP falta para el siguiente nivel", () => {
      const p = levelProgress(150)
      expect(p.level).toBe(2)
      expect(p.next_level_name).toBe("Retoño")
      expect(p.xp_for_next).toBe(150) // 300 - 150
    })

    it("en el último nivel no promete un siguiente que no existe", () => {
      const p = levelProgress(999999)
      expect(p.xp_for_next).toBeNull()
      expect(p.next_level_name).toBeNull()
      expect(p.progress).toBe(1)
    })
  })
})
