/**
 * Données de loyers par commune, tirées de la « Carte des loyers » 2025 (ANIL et ministère de la
 * Transition écologique, licence ouverte 2.0) et découpées pour le navigateur :
 *
 *   public/donnees/loyers-2025/communes.json   index [code INSEE, nom], pour la recherche
 *   public/donnees/loyers-2025/<dep>.json      indicateurs des communes du département
 *
 * Chaque indicateur vaut [loyer prédit au m², borne basse, borne haute, fiabilité], charges
 * comprises, pour un logement vide : fiabilité 0 = estimé sur la commune, 1 = estimé sur la
 * commune mais fragile (moins de 30 annonces ou R² < 0,5), 2 = estimé sur une maille de communes
 * voisines. Voir docs/donnees-loyers.md.
 *
 *   node scripts/loyers.mjs                 télécharge les quatre fichiers sur data.gouv.fr
 *   node scripts/loyers.mjs --source <dir>  lit des fichiers déjà téléchargés (mêmes noms)
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE =
  'https://static.data.gouv.fr/resources/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025'
const FICHIERS = {
  a: `${BASE}/20251211-145010/pred-app-mef-dhup.csv`,
  a12: `${BASE}/20251211-144934/pred-app12-mef-dhup.csv`,
  a3: `${BASE}/20251211-144951/pred-app3-mef-dhup.csv`,
  m: `${BASE}/20251211-145039/pred-mai-mef-dhup.csv`,
}
const SORTIE = 'public/donnees/loyers-2025'
/** Seuils de prudence de la note d'utilisation des données. */
const MIN_ANNONCES = 30
const MIN_R2 = 0.5

const indexSource = process.argv.indexOf('--source')
const source = indexSource > 0 ? process.argv[indexSource + 1] : undefined

async function lire(url) {
  const octets = source
    ? await readFile(join(source, url.split('/').at(-1)))
    : Buffer.from(await (await fetch(url)).arrayBuffer())
  // Les fichiers sont en Windows-1252.
  return new TextDecoder('windows-1252').decode(octets)
}

function lignes(texte) {
  const [entete, ...reste] = texte.split(/\r?\n/).filter(Boolean)
  const champs = (l) => l.split(';').map((c) => c.replace(/^"|"$/g, ''))
  const cles = champs(entete)
  return reste.map((l) => Object.fromEntries(champs(l).map((v, i) => [cles[i], v])))
}

const nombre = (v) => Number(v.replace(',', '.'))
const arrondi = (v) => Math.round(v * 100) / 100

const communes = new Map()
for (const [cle, url] of Object.entries(FICHIERS)) {
  for (const l of lignes(await lire(url))) {
    const code = l.INSEE_C
    const c = communes.get(code) ?? { nom: l.LIBGEO, dep: l.DEP, indicateurs: {} }
    const fiabilite =
      l.TYPPRED !== 'commune'
        ? 2
        : nombre(l.nbobs_com) < MIN_ANNONCES || nombre(l['R2_adj']) < MIN_R2
          ? 1
          : 0
    c.indicateurs[cle] = [
      arrondi(nombre(l.loypredm2)),
      arrondi(nombre(l['lwr.IPm2'])),
      arrondi(nombre(l['upr.IPm2'])),
      fiabilite,
    ]
    communes.set(code, c)
  }
}

await rm(SORTIE, { recursive: true, force: true })
await mkdir(SORTIE, { recursive: true })

// Le département se déduit du code INSEE (shared/loyers/communes.ts) : l'index n'en a pas besoin,
// mais on vérifie que la règle tient pour chaque commune.
const depDuCode = (code) => (code.startsWith('97') ? code.slice(0, 3) : code.slice(0, 2))
for (const [code, c] of communes)
  if (depDuCode(code) !== c.dep) throw new Error(`Département inattendu pour ${code} : ${c.dep}`)

const index = [...communes]
  .map(([code, c]) => [code, c.nom])
  .sort((x, y) => x[1].localeCompare(y[1], 'fr') || x[0].localeCompare(y[0]))
await writeFile(join(SORTIE, 'communes.json'), JSON.stringify(index))

const parDep = new Map()
for (const [code, c] of communes) {
  const dep = parDep.get(c.dep) ?? {}
  dep[code] = c.indicateurs
  parDep.set(c.dep, dep)
}
for (const [dep, contenu] of parDep)
  await writeFile(join(SORTIE, `${dep}.json`), JSON.stringify(contenu))

console.log(`${communes.size} communes, ${parDep.size} départements, écrits dans ${SORTIE}`)
