/**
 * Recherche d'une commune dans l'index de la carte des loyers (public/donnees/loyers-2025),
 * entièrement dans le navigateur : la saisie ne part vers aucun service.
 */

/** [code INSEE, nom officiel] */
export type EntreeIndex = [code: string, nom: string]

export interface Commune {
  code: string
  nom: string
  departement: string
}

/** Le département d'un code INSEE : trois caractères outre-mer (971…), deux sinon (2A, 2B compris). */
export function departementDuCode(code: string): string {
  return code.startsWith('97') ? code.slice(0, 3) : code.slice(0, 2)
}

/** Minuscules, sans accents, tirets et apostrophes changés en espaces, « st » lu « saint ». */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-'’.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^| )ste( |$)/g, '$1sainte$2')
    .replace(/(^| )st( |$)/g, '$1saint$2')
}

const DEPARTEMENT = /^(\d{2,3}|2a|2b)$/

const normalises = new WeakMap<EntreeIndex[], string[]>()
function nomsNormalises(index: EntreeIndex[]): string[] {
  let noms = normalises.get(index)
  if (!noms) {
    noms = index.map(([, nom]) => normaliser(nom))
    normalises.set(index, noms)
  }
  return noms
}

const ordre = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' })

/**
 * Les communes qui correspondent à la saisie, les plus probables d'abord : nom exact, puis
 * premier mot du nom, puis début du nom, puis début d'un mot, puis n'importe où. Un code INSEE trouve sa commune ; un
 * numéro de département en fin de saisie (« saint denis 93 ») départage les homonymes.
 */
export function rechercherCommunes(index: EntreeIndex[], saisie: string, limite = 8): Commune[] {
  const requete = normaliser(saisie)
  const commune = (i: number): Commune => ({
    code: index[i]![0],
    nom: index[i]![1],
    departement: departementDuCode(index[i]![0]),
  })

  if (/^(\d{5}|2a\d{3}|2b\d{3})$/.test(requete)) {
    const i = index.findIndex(([code]) => code.toLowerCase() === requete)
    return i >= 0 ? [commune(i)] : []
  }

  const trouves = chercher(index, requete)
  if (trouves.length) return trouves.slice(0, limite).map(commune)

  // Rien pour la saisie entière : un nombre final peut être un département (« saint denis 93 »),
  // mais seulement en dernier recours, pour que « paris 11 » reste le 11e arrondissement.
  const mots = requete.split(' ')
  if (mots.length > 1 && DEPARTEMENT.test(mots.at(-1)!)) {
    const departement = mots.pop()!.toUpperCase()
    return chercher(index, mots.join(' '), departement).slice(0, limite).map(commune)
  }
  return []
}

function chercher(index: EntreeIndex[], requete: string, departement?: string): number[] {
  if (requete.length < 2) return []
  const noms = nomsNormalises(index)
  const trouves: { i: number; rang: number }[] = []
  noms.forEach((nom, i) => {
    if (departement && departementDuCode(index[i]![0]) !== departement) return
    // « lyon » trouve les arrondissements de Lyon avant Lyons-la-Forêt.
    const rang =
      nom === requete
        ? 0
        : nom.startsWith(`${requete} `)
          ? 1
          : nom.startsWith(requete)
            ? 2
            : nom.includes(` ${requete}`)
              ? 3
              : nom.includes(requete)
                ? 4
                : -1
    if (rang >= 0) trouves.push({ i, rang })
  })
  return trouves
    .sort(
      (x, y) =>
        x.rang - y.rang ||
        // Les noms courts d'abord (« nant » : Nantes avant Nanteuil), sauf entre noms qui
        // commencent par le mot saisi, rangés dans l'ordre : Lyon 1er, 2e… 9e Arrondissement.
        (x.rang === 1 ? 0 : noms[x.i]!.length - noms[y.i]!.length) ||
        ordre.compare(index[x.i]![1], index[y.i]![1]),
    )
    .map(({ i }) => i)
}
