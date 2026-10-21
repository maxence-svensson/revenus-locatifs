import { z } from 'zod'

/**
 * Le dossier décrit un bien mis en location et le foyer qui le détient.
 * Tout ce que l'utilisateur saisit passe par ce schéma : rien n'entre dans le
 * calcul sans validation.
 */

export const TYPES_LOCATION = ['nue', 'meublee'] as const
export type TypeLocation = (typeof TYPES_LOCATION)[number]

export const TRANCHES = [0, 11, 30, 41, 45] as const
export type Tranche = (typeof TRANCHES)[number]

export const NATURES_TRAVAUX = ['entretien', 'amelioration', 'energetique', 'construction'] as const
export type NatureTravaux = (typeof NATURES_TRAVAUX)[number]

const montant = z.coerce.number().min(0).finite()
const taux = z.coerce.number().min(0).max(100).finite()
const annee = z.coerce.number().int().min(1990).max(2100)

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
})
export type Bien = z.infer<typeof bienSchema>

export const foyerSchema = z.object({
  /** Tranche marginale d'imposition du foyer. */
  tmi: z.coerce
    .number()
    .pipe(z.union(TRANCHES.map((t) => z.literal(t))))
    .default(30),
  /** Autres recettes foncières ou BIC du foyer, qui comptent pour les plafonds du micro. */
  autresRecettesMemeCategorie: montant.default(0),
})
export type Foyer = z.infer<typeof foyerSchema>

export const dossierSchema = z.object({
  version: z.literal(1).default(1),
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
    foyer: { tmi: 30, autresRecettesMemeCategorie: 0 },
    horizonAnnees: 10,
  })
}
