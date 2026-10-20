import { z } from 'zod'
import { dossierSchema, type Dossier } from '#shared/model/dossier'

const CLE = 'revenus-locatifs:dossier:v1'

const enregistrementSchema = z.object({
  demo: z.boolean().default(false),
  dossier: dossierSchema,
})

export interface Enregistrement {
  demo: boolean
  dossier: Dossier
}

/** Lecture du dossier enregistré dans le navigateur ; rien n'en sort. */
export function lireDossier(): Enregistrement | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return null
    const resultat = enregistrementSchema.safeParse(JSON.parse(brut))
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
