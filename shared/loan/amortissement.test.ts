import { describe, expect, it } from 'vitest'
import { d, somme } from '../tax/decimal'
import { chargesEmpruntParAnnee, mensualite, tableauAmortissement } from './amortissement'
import type { Emprunt } from '../model/dossier'

const emprunt: Emprunt = {
  actif: true,
  capital: 150000,
  tauxAnnuel: 3.4,
  dureeMois: 240,
  anneeDebut: 2025,
  moisDebut: 1,
  tauxAssurance: 0.3,
  fraisDossier: 800,
}

describe('mensualité', () => {
  it('suit la formule du prêt amortissable', () => {
    // 150 000 € à 3,4 % sur 20 ans : 862,25 € par mois, arrondi au centime.
    expect(mensualite(d(150000), d('3.4'), 240).toFixed(2)).toBe('862.25')
  })
  it('se réduit au capital divisé par la durée à taux nul', () => {
    expect(mensualite(d(12000), d(0), 12).toFixed(2)).toBe('1000.00')
  })
})

describe('tableau d’amortissement', () => {
  it('rembourse exactement le capital', () => {
    const t = tableauAmortissement(emprunt)
    expect(t).toHaveLength(240)
    expect(somme(t.map((e) => e.capitalRembourse)).toFixed(2)).toBe('150000.00')
    expect(t.at(-1)!.capitalRestant.isZero()).toBe(true)
  })
  it('calcule les intérêts du premier mois sur le capital initial', () => {
    const t = tableauAmortissement(emprunt)
    expect(t[0]!.interets.toFixed(2)).toBe('425.00')
  })
  it('suit les mois et les années', () => {
    const t = tableauAmortissement({ ...emprunt, moisDebut: 11, dureeMois: 4 })
    expect(t.map((e) => `${e.annee}-${e.mois}`)).toEqual(['2025-11', '2025-12', '2026-1', '2026-2'])
  })
})

describe('charges d’emprunt par année', () => {
  it('somme les intérêts, l’assurance et les frais la première année', () => {
    const parAnnee = chargesEmpruntParAnnee(emprunt)
    const premiere = parAnnee.get(2025)!
    expect(premiere.assurance.toFixed(2)).toBe('450.00')
    expect(premiere.frais.toFixed(0)).toBe('800')
    expect(premiere.interets.greaterThan(5000)).toBe(true)
    expect(parAnnee.get(2026)!.frais.isZero()).toBe(true)
    expect(parAnnee.get(2026)!.interets.lessThan(premiere.interets)).toBe(true)
  })
  it('ne renvoie rien sans emprunt', () => {
    expect(chargesEmpruntParAnnee({ ...emprunt, actif: false }).size).toBe(0)
  })
})
