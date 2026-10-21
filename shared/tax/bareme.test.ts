import { describe, expect, it } from 'vitest'
import { d } from './decimal'
import { reglesPour } from './rules'
import { droitsBareme, impotSurLeRevenu, plafondQuotient } from './bareme'

const regles = reglesPour(2025)
const seul = { situation: 'seul' as const, parts: 1 }
const couple = { situation: 'couple' as const, parts: 2 }

describe('barème des revenus 2025', () => {
  it('taxe chaque tranche à son taux', () => {
    // (29 579 − 11 600) × 11 % + (30 000 − 29 579) × 30 % = 1 977,69 + 126,30
    expect(droitsBareme(d(30000), 1, regles).toFixed(2)).toBe('2103.99')
    const r = impotSurLeRevenu(d(30000), seul, regles)
    expect(r.impot.toFixed(0)).toBe('2104')
    expect(r.decote.isZero()).toBe(true)
    expect(r.tmi).toBe(30)
  })

  it('divise le revenu par le nombre de parts', () => {
    const r = impotSurLeRevenu(d(60000), couple, regles)
    expect(r.impot.toFixed(0)).toBe('4208')
    expect(r.tmi).toBe(30)
  })

  it('n’impose rien sous le premier seuil', () => {
    const r = impotSurLeRevenu(d(11000), seul, regles)
    expect(r.impot.isZero()).toBe(true)
    expect(r.tmi).toBe(0)
  })

  it('plafonne l’avantage de chaque demi-part à 1 807 €', () => {
    // Couple, un enfant (2,5 parts) ou deux (3 parts), 100 000 € de revenu.
    // Avec 3 parts : 3 × 3 103,99 = 9 311,97. Avec 2 parts : 16 207,98, moins 2 × 1 807 = 12 593,98.
    const r = impotSurLeRevenu(d(100000), { situation: 'couple', parts: 3 }, regles)
    expect(r.droitsQuotient.toFixed(2)).toBe('9311.97')
    expect(r.plafonnementApplique).toBe(true)
    expect(r.impot.toFixed(0)).toBe('12594')
    // Le plafonnement ramène au taux marginal des parts de base.
    expect(r.tmi).toBe(30)
  })

  it('compte 904 € par quart de part', () => {
    expect(plafondQuotient({ situation: 'couple', parts: 2.75 }, regles).toFixed(0)).toBe('2711')
    expect(plafondQuotient({ situation: 'seul', parts: 1 }, regles).isZero()).toBe(true)
  })

  it('applique la décote d’une personne seule', () => {
    // Impôt brut 924 : décote 897 − 45,25 % × 924 = 478,89 ; reste 445,11.
    const r = impotSurLeRevenu(d(20000), seul, regles)
    expect(r.impotBrut.toFixed(0)).toBe('924')
    expect(r.decote.toFixed(2)).toBe('478.89')
    expect(r.impot.toFixed(0)).toBe('445')
  })

  it('applique la décote d’un couple', () => {
    // Impôt brut 1 848 : décote 1 483 − 45,25 % × 1 848 = 646,78 ; reste 1 201,22.
    const r = impotSurLeRevenu(d(40000), couple, regles)
    expect(r.impotBrut.toFixed(0)).toBe('1848')
    expect(r.decote.toFixed(2)).toBe('646.78')
    expect(r.impot.toFixed(0)).toBe('1201')
  })

  it('ne recouvre pas un impôt inférieur à 61 €', () => {
    // Impôt brut 640, décote 607,40 : 33 € net, non mis en recouvrement.
    const r = impotSurLeRevenu(d(17418), seul, regles)
    expect(r.impotBrut.toFixed(0)).toBe('640')
    expect(r.impot.isZero()).toBe(true)
  })

  it('ne rend jamais d’impôt négatif', () => {
    expect(impotSurLeRevenu(d(-5000), seul, regles).impot.isZero()).toBe(true)
  })
})
