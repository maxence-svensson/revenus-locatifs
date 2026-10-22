import { z } from 'zod'
import { SITUATIONS, partsDeBase } from '../tax/bareme'

/**
 * Le dossier décrit un bien mis en location et le foyer qui le détient.
 * Tout ce que l'utilisateur saisit passe par ce schéma : rien n'entre dans le
 * calcul sans validation.
 */

export const TYPES_LOCATION = ['nue', 'meublee'] as const
export type TypeLocation = (typeof TYPES_LOCATION)[number]

export { SITUATIONS, type Situation } from '../tax/bareme'

export const NATURES_TRAVAUX = ['entretien', 'amelioration', 'energetique', 'construction'] as const
export type NatureTravaux = (typeof NATURES_TRAVAUX)[number]

const montant = z.coerce.number().min(0).finite()
const taux = z.coerce.number().min(0).max(100).finite()
const annee = z.coerce.number().int().min(1990).max(2100)

export const TYPES_BIEN = ['appartement', 'maison'] as const

/**
 * Où se trouve le bien et ce qu'il est : de quoi estimer un loyer de marché avec la carte des
 * loyers (shared/loyers). Facultatif ; sans effet sur le calcul fiscal.
 */
export const localisationSchema = z.object({
  /** Code INSEE de la commune, ou de l'arrondissement à Paris, Lyon et Marseille. */
  codeInsee: z
    .string()
    .regex(/^(\d{5}|2[AB]\d{3})$/)
    .or(z.literal(''))
    .default(''),
  nomCommune: z.string().max(80).default(''),
  typeBien: z.enum(TYPES_BIEN).default('appartement'),
  /** Pièces principales, hors cuisine et salle de bain. */
  pieces: z.coerce.number().int().min(0).max(20).default(2),
  /** Surface habitable, en m². */
  surface: z.coerce.number().min(0).max(1000).finite().default(0),
  /** Charges refacturées au locataire, par mois. */
  chargesRecuperables: montant.default(0),
})
export type Localisation = z.infer<typeof localisationSchema>

export const travauxSchema = z.object({
  id: z.string(),
  annee,
  montant,
  nature: z.enum(NATURES_TRAVAUX),
  libelle: z.string().max(80).default(''),
})
export type Travaux = z.infer<typeof travauxSchema>

export const empruntSchema = z.object({
  actif: z.boolean().default(false),
  capital: montant.default(0),
  tauxAnnuel: taux.default(0),
  dureeMois: z.coerce.number().int().min(1).max(600).default(240),
  anneeDebut: annee,
  moisDebut: z.coerce.number().int().min(1).max(12).default(1),
  /** Assurance emprunteur, en pourcentage du capital initial par an. */
  tauxAssurance: taux.default(0),
  fraisDossier: montant.default(0),
})
export type Emprunt = z.infer<typeof empruntSchema>

export const bienSchema = z.object({
  nom: z.string().max(60).default('Mon bien'),
  typeLocation: z.enum(TYPES_LOCATION).default('nue'),
  anneeMiseEnLocation: annee,
  /** Prix d'achat du bien, hors frais. */
  prixAcquisition: montant.default(0),
  /** Frais de notaire et d'agence à l'achat. */
  fraisAcquisition: montant.default(0),
  /** Part du prix représentant le terrain, non amortissable (meublé). */
  partTerrainPourcent: taux.default(15),
  /** Valeur du mobilier (meublé). */
  mobilier: montant.default(0),

  loyerMensuelHorsCharges: montant.default(0),
  /** Mois de vacance locative par an, en moyenne. */
  vacanceMoisParAn: z.coerce.number().min(0).max(12).default(0),
  revalorisationLoyersPourcent: taux.default(1.5),
  revalorisationChargesPourcent: taux.default(1.5),
  /**
   * Écart de loyer entre le meublé et le nu, en pourcentage. Sert à la comparaison
   * nue / meublée : le loyer saisi est celui du type choisi, l'autre s'en déduit.
   */
  supplementLoyerMeublePourcent: taux.default(0),

  taxeFonciere: montant.default(0),
  /** Assurances propriétaire non occupant et loyers impayés. */
  assurances: montant.default(0),
  /** Frais de gestion locative, en pourcentage des loyers encaissés. */
  fraisGestionPourcent: taux.default(0),
  /** Charges de copropriété restant à la charge du propriétaire. */
  chargesCopropriete: montant.default(0),
  /** Frais d'expert-comptable (surtout au réel en meublé). */
  fraisComptable: montant.default(0),
  /** Cotisation foncière des entreprises (meublé). */
  cfe: montant.default(0),

  travaux: z.array(travauxSchema).default([]),
  emprunt: empruntSchema,
  localisation: localisationSchema.default(() => localisationSchema.parse({})),
})
export type Bien = z.infer<typeof bienSchema>

export const foyerSchema = z
  .object({
    /** Personne seule, ou couple marié ou pacsé soumis à imposition commune. */
    situation: z.enum(SITUATIONS).default('seul'),
    /** Nombre de parts du quotient familial, par quarts de part. */
    parts: z.coerce.number().min(1).max(20).multipleOf(0.25).default(1),
    /** Revenu net imposable du foyer hors ce bien, supposé constant sur la projection. */
    revenuImposable: montant.default(0),
    /** Autres recettes foncières ou BIC du foyer, qui comptent pour les plafonds du micro. */
    autresRecettesMemeCategorie: montant.default(0),
  })
  .refine((f) => f.parts >= partsDeBase(f.situation), {
    message: 'Un couple marié ou pacsé compte au moins deux parts.',
    path: ['parts'],
  })
export type Foyer = z.infer<typeof foyerSchema>

export const dossierSchema = z.object({
  version: z.literal(2).default(2),
  bien: bienSchema,
  foyer: foyerSchema,
  /** Nombre d'années projetées. */
  horizonAnnees: z.coerce.number().int().min(1).max(30).default(10),
})
export type Dossier = z.infer<typeof dossierSchema>

export function dossierVide(anneeCourante: number): Dossier {
  return dossierSchema.parse({
    bien: {
      anneeMiseEnLocation: anneeCourante,
      emprunt: { anneeDebut: anneeCourante },
    },
    foyer: {},
  })
}

/** Un exemple fictif, clairement signalé dans l'interface, pour essayer sans rien saisir. */
export function dossierExemple(anneeCourante: number): Dossier {
  return dossierSchema.parse({
    bien: {
      nom: 'T2 à Nantes (exemple)',
      typeLocation: 'nue',
      anneeMiseEnLocation: anneeCourante,
      prixAcquisition: 180000,
      fraisAcquisition: 14000,
      partTerrainPourcent: 15,
      mobilier: 6000,
      loyerMensuelHorsCharges: 720,
      vacanceMoisParAn: 0.5,
      revalorisationLoyersPourcent: 1.5,
      revalorisationChargesPourcent: 1.5,
      supplementLoyerMeublePourcent: 12,
      taxeFonciere: 900,
      assurances: 320,
      fraisGestionPourcent: 7,
      chargesCopropriete: 600,
      fraisComptable: 0,
      cfe: 0,
      travaux: [
        {
          id: 'ex-1',
          annee: anneeCourante,
          montant: 12000,
          nature: 'amelioration',
          libelle: 'Cuisine et salle de bain',
        },
      ],
      localisation: {
        codeInsee: '44109',
        nomCommune: 'Nantes',
        typeBien: 'appartement',
        pieces: 2,
        surface: 45,
        chargesRecuperables: 40,
      },
      emprunt: {
        actif: true,
        capital: 150000,
        tauxAnnuel: 3.4,
        dureeMois: 240,
        anneeDebut: anneeCourante,
        moisDebut: 1,
        tauxAssurance: 0.3,
        fraisDossier: 800,
      },
    },
    foyer: {
      situation: 'couple',
      parts: 2,
      revenuImposable: 62000,
      autresRecettesMemeCategorie: 0,
    },
    horizonAnnees: 10,
  })
}

/**
 * Revenu d'une personne seule, à une part, placé dans chaque tranche marginale : la version 1
 * ne demandait que la tranche, la version 2 demande le revenu et les parts.
 */
const REVENU_PAR_TRANCHE: Record<number, number> = {
  0: 10000,
  11: 20000,
  30: 50000,
  41: 120000,
  45: 250000,
}

/**
 * Remet au format actuel un dossier enregistré par une version précédente. Un dossier de la
 * version 1 garde son bien ; son foyer devient une personne seule à une part, avec un revenu
 * qui la place dans la tranche qu'elle avait choisie, et `migre` le signale pour que
 * l'interface demande de vérifier.
 */
export function migrerDossier(brut: unknown): { dossier: unknown; migre: boolean } {
  if (!brut || typeof brut !== 'object') return { dossier: brut, migre: false }
  const ancien = brut as { version?: unknown; foyer?: Record<string, unknown> }
  if (ancien.version !== 1 && !(ancien.foyer && 'tmi' in ancien.foyer))
    return { dossier: brut, migre: false }
  const { tmi, ...foyer } = ancien.foyer ?? {}
  return {
    dossier: {
      ...ancien,
      version: 2,
      foyer: {
        ...foyer,
        situation: 'seul',
        parts: 1,
        revenuImposable: REVENU_PAR_TRANCHE[Number(tmi)] ?? REVENU_PAR_TRANCHE[30],
      },
    },
    migre: true,
  }
}
