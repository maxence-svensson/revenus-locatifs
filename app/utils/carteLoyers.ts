import type { EntreeIndex } from '#shared/loyers/communes'
import type { IndicateursCommune } from '#shared/loyers/estimation'

/**
 * Les fichiers de la carte des loyers sont servis par le site lui-même (public/donnees) : la
 * commune cherchée ne part vers aucun service tiers. L'index se charge à la première recherche,
 * chaque département quand une de ses communes est choisie, une seule fois par visite.
 */
const BASE = '/donnees/loyers-2025'

async function json<T>(chemin: string): Promise<T> {
  const reponse = await fetch(`${BASE}/${chemin}`)
  if (!reponse.ok) throw new Error(`${chemin} : ${reponse.status}`)
  return (await reponse.json()) as T
}

let index: Promise<EntreeIndex[]> | undefined
const departements = new Map<string, Promise<Record<string, IndicateursCommune>>>()

export function chargerIndexCommunes(): Promise<EntreeIndex[]> {
  index ??= json<EntreeIndex[]>('communes.json').catch((erreur) => {
    index = undefined
    throw erreur
  })
  return index
}

export function chargerDepartement(departement: string) {
  let promesse = departements.get(departement)
  if (!promesse) {
    promesse = json<Record<string, IndicateursCommune>>(`${departement}.json`).catch((erreur) => {
      departements.delete(departement)
      throw erreur
    })
    departements.set(departement, promesse)
  }
  return promesse
}
