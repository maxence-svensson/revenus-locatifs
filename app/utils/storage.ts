import { z } from 'zod'
import { dossierSchema, migrerDossier, type Dossier } from '#shared/model/dossier'

const CLE = 'revenus-locatifs:dossier:v1'

const enregistrementSchema = z.object({
  demo: z.boolean().default(false),
  /** Le dossier vient d'une version précédente : le foyer est à vérifier. */
  aRevoir: z.boolean().default(false),
  dossier: dossierSchema,
})

export interface Enregistrement {
  demo: boolean
  aRevoir: boolean
  dossier: Dossier
}

/** Lecture du dossier enregistré dans le navigateur ; rien n'en sort. */
export function lireDossier(): Enregistrement | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return null
    const lu = JSON.parse(brut) as { dossier?: unknown; aRevoir?: unknown }
    const { dossier, migre } = migrerDossier(lu?.dossier)
    const resultat = enregistrementSchema.safeParse({
      ...lu,
      dossier,
      aRevoir: lu?.aRevoir === true || migre,
    })
    return resultat.success ? resultat.data : null
  } catch {
    return null
  }
}

export function enregistrerDossier(enregistrement: Enregistrement) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(CLE, JSON.stringify(enregistrement))
  } catch {
    // Stockage indisponible (navigation privée, quota) : l'application fonctionne sans.
  }
}

export function effacerDossier() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(CLE)
  } catch {
    // Rien à faire.
  }
}
