import { describe, expect, it } from 'vitest'
import { dossierExemple, dossierSchema, migrerDossier } from './dossier'

describe('dossier', () => {
  it('reprend un dossier de la version 1 avec une estimation du revenu', () => {
    const exemple = dossierExemple(2025)
    const ancien = {
      ...exemple,
      version: 1,
      foyer: { tmi: 41, autresRecettesMemeCategorie: 3000 },
    }
    const { dossier, migre } = migrerDossier(ancien)
    expect(migre).toBe(true)
    const valide = dossierSchema.parse(dossier)
    expect(valide.version).toBe(2)
    expect(valide.foyer).toEqual({
      situation: 'seul',
      parts: 1,
      revenuImposable: 120000,
      autresRecettesMemeCategorie: 3000,
    })
    expect(valide.bien.loyerMensuelHorsCharges).toBe(exemple.bien.loyerMensuelHorsCharges)
  })

  it('laisse un dossier à jour tel quel', () => {
    const exemple = dossierExemple(2025)
    expect(migrerDossier(exemple)).toEqual({ dossier: exemple, migre: false })
  })

  it('refuse un couple à moins de deux parts', () => {
    const exemple = dossierExemple(2025)
    const r = dossierSchema.safeParse({
      ...exemple,
      foyer: { ...exemple.foyer, situation: 'couple', parts: 1.5 },
    })
    expect(r.success).toBe(false)
  })

  it('n’accepte que des quarts de part', () => {
    const exemple = dossierExemple(2025)
    const r = dossierSchema.safeParse({ ...exemple, foyer: { ...exemple.foyer, parts: 2.3 } })
    expect(r.success).toBe(false)
  })
})
