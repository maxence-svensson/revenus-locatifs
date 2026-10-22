import { describe, expect, it } from 'vitest'
import { departementDuCode, normaliser, rechercherCommunes, type EntreeIndex } from './communes'
import { encadrementPour, TERRITOIRES_ENCADRES } from './encadrement'
import { estimerLoyer, loyerHorsCharges, type IndicateursCommune } from './estimation'
// Les fichiers générés par scripts/loyers.mjs, tels que le site les sert.
import communes from '../../public/donnees/loyers-2025/communes.json'
import loireAtlantique from '../../public/donnees/loyers-2025/44.json'

const index = communes as unknown as EntreeIndex[]
const nantes = (loireAtlantique as unknown as Record<string, IndicateursCommune>)['44109']!

describe('données de la carte des loyers 2025', () => {
  it('couvre toutes les communes, hors Mayotte', () => {
    expect(index).toHaveLength(34900)
    expect(departementDuCode('97411')).toBe('974')
    expect(departementDuCode('2A004')).toBe('2A')
  })

  it('reprend les indicateurs publiés pour Nantes', () => {
    expect(nantes.a).toEqual([14.5, 11.35, 18.54, 0])
    expect(nantes.a12).toEqual([16.57, 13.23, 20.75, 0])
    expect(nantes.m![0]).toBe(14.35)
  })
})

describe('recherche de commune', () => {
  const premier = (saisie: string) => rechercherCommunes(index, saisie)[0]?.code

  it('trouve une commune sans accents ni tirets', () => {
    expect(normaliser('Épinay-sur-Seine')).toBe('epinay sur seine')
    expect(premier('nantes')).toBe('44109')
    expect(premier('epinay sur seine')).toBe('93031')
  })

  it('lit « st » comme « saint » et départage les homonymes par le département', () => {
    expect(premier('st denis 93')).toBe('93066')
    expect(premier('saint-denis 974')).toBe('97411')
  })

  it('cherche les arrondissements de Paris et de Lyon', () => {
    expect(premier('paris 11')).toBe('75111')
    expect(rechercherCommunes(index, 'lyon')[0]!.nom).toMatch(/^Lyon 1er/)
    // Les noms courts d'abord : Nantes avant Nanteuil-le-Haudouin.
    expect(premier('nante')).toBe('44109')
  })

  it('accepte un code INSEE', () => {
    expect(rechercherCommunes(index, '44109')).toEqual([
      { code: '44109', nom: 'Nantes', departement: '44' },
    ])
  })

  it('attend deux lettres', () => {
    expect(rechercherCommunes(index, 'n')).toEqual([])
  })
})

describe('estimation du loyer', () => {
  it('multiplie le loyer au m² par la surface', () => {
    const e = estimerLoyer(nantes, 'appartement', 2, 40)!
    expect(e.cle).toBe('a12')
    expect(e.mensuel).toBe(663)
    expect([e.bas, e.haut]).toEqual([529, 830])
    expect(e.surfaceAtypique).toBe(false)
  })

  it('signale une surface éloignée du logement type', () => {
    const e = estimerLoyer(nantes, 'appartement', 4, 160)!
    expect(e.cle).toBe('a3')
    expect(e.surfaceAtypique).toBe(true)
  })

  it('retire les charges refacturées', () => {
    expect(loyerHorsCharges(663, 50)).toBe(613)
    expect(loyerHorsCharges(100, 300)).toBe(0)
  })

  it('n’estime rien sans surface', () => {
    expect(estimerLoyer(nantes, 'maison', 0, 0)).toBeUndefined()
  })
})

describe('encadrement des loyers', () => {
  it('ne cite que des communes de la carte des loyers', () => {
    const codes = new Set(index.map(([code]) => code))
    for (const t of TERRITOIRES_ENCADRES)
      for (const code of [...t.communes, ...(t.communesEnPartie ?? [])])
        expect(codes.has(code), `${t.nom} : ${code}`).toBe(true)
  })

  it('reconnaît une commune encadrée, entière ou en partie', () => {
    expect(encadrementPour('75111', '2026-10-22')!.territoire.nom).toBe('Paris')
    expect(encadrementPour('69266', '2026-10-22')!.territoire.nom).toBe('Lyon et Villeurbanne')
    const grenoble = encadrementPour('38185', '2026-10-22')!
    expect(grenoble.enPartie).toBe(true)
    expect(grenoble.echeancePassee).toBe(false)
    expect(encadrementPour('44109', '2026-10-22')).toBeUndefined()
  })

  it('signale l’échéance de l’expérimentation une fois passée', () => {
    expect(encadrementPour('33063', '2026-11-25')!.echeancePassee).toBe(true)
  })
})
