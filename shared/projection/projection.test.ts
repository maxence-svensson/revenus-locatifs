import { describe, expect, it } from 'vitest'
import { dossierExemple, dossierSchema } from '../model/dossier'
import { projeter } from './projection'
import { casesPour } from '../tax/cases'

describe('projection', () => {
  it('projette l’exemple en location nue sur dix ans', () => {
    const p = projeter(dossierExemple(2025))
    expect(p.annees).toHaveLength(10)
    expect(p.annees.map((a) => a.annee)).toEqual([
      2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034,
    ])
    // Première année : travaux de 12 000 et intérêts, le réel dégage un déficit.
    const premiere = p.annees[0]!
    expect(premiere.reel.resultat.regime).toBe('reel-foncier')
    expect(premiere.reel.net.lessThan(premiere.micro.net)).toBe(true)
    expect(p.recommandation).toBe('reel')
    expect(p.economieReel.greaterThan(0)).toBe(true)
    expect(p.avertissements.some((a) => a.includes('3 ans'))).toBe(true)
  })

  it('projette le même bien en meublé avec des amortissements', () => {
    const base = dossierExemple(2025)
    const p = projeter(
      dossierSchema.parse({ ...base, bien: { ...base.bien, typeLocation: 'meublee' } }),
    )
    const premiere = p.annees[0]!
    expect(premiere.reel.resultat.regime).toBe('reel-bic')
    expect(premiere.micro.resultat.regime).toBe('micro-bic')
    expect(p.plan.length).toBeGreaterThan(0)
    // Les amortissements effacent le bénéfice : zéro impôt au réel.
    expect(premiere.reel.net.isZero()).toBe(true)
    expect(p.recommandation).toBe('reel')
  })

  it('tient compte de la CSG déductible l’année suivante', () => {
    const p = projeter(dossierExemple(2025))
    const seconde = p.annees[1]!
    expect(seconde.micro.economieCsgDeductible.greaterThan(0)).toBe(true)
    // L'impôt net de l'année se décompose : revenu locatif, moins la CSG de l'an passé, plus les
    // prélèvements sociaux.
    const m = seconde.micro
    expect(m.net.toFixed(0)).toBe(
      m.impotRevenu.minus(m.economieCsgDeductible).plus(m.prelevementsSociaux).toFixed(0),
    )
  })

  it('impose le réel quand le micro n’est pas applicable', () => {
    const base = dossierExemple(2025)
    const p = projeter(
      dossierSchema.parse({
        ...base,
        foyer: { ...base.foyer, autresRecettesMemeCategorie: 20000 },
      }),
    )
    expect(p.microApplicablePremiereAnnee).toBe(false)
    expect(p.recommandation).toBe('reel')
  })

  it('reste indifférent quand rien ne distingue les régimes', () => {
    const base = dossierExemple(2025)
    const p = projeter(
      dossierSchema.parse({
        ...base,
        horizonAnnees: 1,
        bien: {
          ...base.bien,
          loyerMensuelHorsCharges: 0,
          taxeFonciere: 0,
          assurances: 0,
          fraisGestionPourcent: 0,
          chargesCopropriete: 0,
          travaux: [],
          emprunt: { ...base.bien.emprunt, actif: false },
        },
      }),
    )
    expect(p.recommandation).toBe('indifferent')
  })

  it('impose le revenu locatif au barème, à cheval sur deux tranches', () => {
    // Personne seule, 28 000 € de revenu : impôt de 1 804 € avant décote, 1 723 € après.
    // Micro-foncier sur 12 000 € de loyers : 8 400 € de plus, soit 36 400 € et 4 024 € d'impôt.
    // L'écart, 2 301 €, est moins que les 2 520 € d'une tranche de 30 % appliquée à tout.
    const p = projeter(
      dossierSchema.parse({
        bien: {
          anneeMiseEnLocation: 2025,
          loyerMensuelHorsCharges: 1000,
          revalorisationLoyersPourcent: 0,
          emprunt: { anneeDebut: 2025 },
        },
        foyer: { situation: 'seul', parts: 1, revenuImposable: 28000 },
        horizonAnnees: 1,
      }),
    )
    const micro = p.annees[0]!.micro
    expect(micro.resultat.baseImposable.toFixed(0)).toBe('8400')
    expect(micro.impotRevenu.toFixed(0)).toBe('2301')
    expect(micro.prelevementsSociaux.toFixed(0)).toBe('1445')
    expect(micro.net.toFixed(0)).toBe('3746')
    expect(micro.tmi).toBe(30)
  })

  it('chiffre l’économie du déficit foncier au barème, décote comprise', () => {
    // 12 000 € de loyers, 20 000 € de travaux : 8 020 € de déficit imputé sur le revenu global.
    // Revenu de 33 000 € (impôt 3 004 €) ramené à 24 980 € (impôt 1 472 €, décote 230,92 € : 1 241 €).
    const p = projeter(
      dossierSchema.parse({
        bien: {
          anneeMiseEnLocation: 2025,
          loyerMensuelHorsCharges: 1000,
          travaux: [{ id: 't', annee: 2025, montant: 20000, nature: 'entretien' }],
          emprunt: { anneeDebut: 2025 },
        },
        foyer: { situation: 'seul', parts: 1, revenuImposable: 33000 },
        horizonAnnees: 1,
      }),
    )
    const reel = p.annees[0]!.reel
    expect(reel.impotRevenu.isZero()).toBe(true)
    expect(reel.economieDeficitGlobal.toFixed(0)).toBe('1763')
    expect(reel.net.toFixed(0)).toBe('-1763')
    expect(reel.tmi).toBe(11)
  })

  it('signale un déficit imputé plus grand que le revenu du foyer', () => {
    const base = dossierExemple(2025)
    const p = projeter(
      dossierSchema.parse({ ...base, foyer: { ...base.foyer, revenuImposable: 2000 } }),
    )
    expect(p.avertissements.some((a) => a.includes('six ans'))).toBe(true)
  })

  it('applique 17,2 % de prélèvements sociaux en nu et 18,6 % en meublé', () => {
    // 8 280 € de loyers : 5 796 € de base au micro-foncier, 4 140 € au micro-BIC.
    const base = dossierExemple(2025)
    const nue = projeter(base).annees[0]!.micro
    const meublee = projeter(
      dossierSchema.parse({ ...base, bien: { ...base.bien, typeLocation: 'meublee' } }),
    ).annees[0]!.micro
    expect(nue.resultat.baseImposable.toFixed(0)).toBe('5796')
    expect(nue.prelevementsSociaux.toFixed(0)).toBe('997')
    expect(meublee.resultat.baseImposable.toFixed(0)).toBe('4140')
    expect(meublee.prelevementsSociaux.toFixed(0)).toBe('770')
  })

  it('produit les cases à reporter des deux régimes', () => {
    const p = projeter(dossierExemple(2025))
    const micro = casesPour(p.annees[0]!, 'micro')
    const reel = casesPour(p.annees[0]!, 'reel')
    expect(micro.map((c) => c.numero)).toEqual(['4BE'])
    expect(reel.map((c) => c.numero)).toContain('263')
    expect(reel.map((c) => c.numero)).toContain('4BC')
  })
})
