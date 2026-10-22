<script setup lang="ts">
/**
 * Estimer le loyer d'après la commune : la carte des loyers 2025 donne un loyer d'annonce au m²,
 * charges comprises, pour un logement vide. On le ramène à la surface du bien, on retire les
 * charges refacturées, on ajoute le supplément du meublé si besoin, et l'utilisateur décide de
 * reprendre le chiffre. Dans une commune encadrée, le plafond légal prime : on le signale.
 */
import {
  departementDuCode,
  rechercherCommunes,
  type Commune,
  type EntreeIndex,
} from '#shared/loyers/communes'
import { encadrementPour, FIN_EXPERIMENTATION } from '#shared/loyers/encadrement'
import {
  estimerLoyer,
  loyerHorsCharges,
  MILLESIME_LOYERS,
  SOURCE_LOYERS,
  type IndicateursCommune,
} from '#shared/loyers/estimation'
import { TYPES_BIEN } from '#shared/model/dossier'
import { chargerDepartement, chargerIndexCommunes } from '~/utils/carteLoyers'

const store = useDossierStore()
const b = computed(() => store.brouillon.bien)
const loc = computed(() => store.brouillon.bien.localisation)
const meuble = computed(() => b.value.typeLocation === 'meublee')

const optionsType = TYPES_BIEN.map((t) => ({
  valeur: t,
  libelle: t === 'appartement' ? 'Appartement' : 'Maison',
}))

// --- Recherche de la commune
const idChamp = useId()
const idListe = useId()
const libelleCommune = (c: { nom: string; departement: string }) => `${c.nom} (${c.departement})`
const saisie = ref('')
// Le dossier enregistré est relu après le premier rendu : le champ suit la commune choisie.
watch(
  () => [loc.value.codeInsee, loc.value.nomCommune] as const,
  ([code, nom]) => {
    saisie.value = code ? libelleCommune({ nom, departement: departementDuCode(code) }) : ''
  },
  { immediate: true },
)
const index = shallowRef<EntreeIndex[]>()
const etatIndex = ref<'attente' | 'chargement' | 'erreur'>('attente')
const ouvert = ref(false)
const actif = ref(0)

async function preparer() {
  if (index.value || etatIndex.value === 'chargement') return
  etatIndex.value = 'chargement'
  try {
    index.value = await chargerIndexCommunes()
    etatIndex.value = 'attente'
  } catch {
    etatIndex.value = 'erreur'
  }
}

const resultats = computed<Commune[]>(() =>
  index.value && ouvert.value ? rechercherCommunes(index.value, saisie.value) : [],
)
watch(resultats, () => (actif.value = 0))

function choisir(c: Commune) {
  loc.value.codeInsee = c.code
  loc.value.nomCommune = c.nom
  saisie.value = libelleCommune(c)
  ouvert.value = false
}

function clavier(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    ouvert.value = true
    const n = resultats.value.length
    if (n) actif.value = (actif.value + (e.key === 'ArrowDown' ? 1 : n - 1)) % n
  } else if (e.key === 'Enter' && ouvert.value && resultats.value[actif.value]) {
    e.preventDefault()
    choisir(resultats.value[actif.value]!)
  } else if (e.key === 'Escape') {
    ouvert.value = false
  }
}

function saisir() {
  ouvert.value = true
  void preparer()
  // Effacer le champ, c'est retirer la commune.
  if (!saisie.value.trim() && loc.value.codeInsee) {
    loc.value.codeInsee = ''
    loc.value.nomCommune = ''
  }
}

// --- Indicateurs du département de la commune choisie
const indicateurs = shallowRef<IndicateursCommune>()
const etatDonnees = ref<'attente' | 'chargement' | 'erreur'>('attente')
async function chargerCommune(code: string) {
  indicateurs.value = undefined
  if (!code) return
  etatDonnees.value = 'chargement'
  try {
    const dep = await chargerDepartement(departementDuCode(code))
    if (loc.value.codeInsee === code) indicateurs.value = dep[code]
    etatDonnees.value = 'attente'
  } catch {
    etatDonnees.value = 'erreur'
  }
}
onMounted(() => {
  watch(() => loc.value.codeInsee, chargerCommune, { immediate: true })
})

// --- Estimation
const estimation = computed(() =>
  indicateurs.value
    ? estimerLoyer(indicateurs.value, loc.value.typeBien, loc.value.pieces, loc.value.surface)
    : undefined,
)
const horsCharges = computed(() =>
  estimation.value ? loyerHorsCharges(estimation.value.mensuel, loc.value.chargesRecuperables) : 0,
)
/** Le loyer à reprendre dans le dossier : en meublé, avec le supplément indiqué. */
const loyerPropose = computed(() =>
  meuble.value
    ? Math.round(horsCharges.value * (1 + b.value.supplementLoyerMeublePourcent / 100))
    : horsCharges.value,
)
const dejaRepris = computed(() => b.value.loyerMensuelHorsCharges === loyerPropose.value)
function reprendre() {
  b.value.loyerMensuelHorsCharges = loyerPropose.value
}

const encadrement = computed(() =>
  loc.value.codeInsee
    ? encadrementPour(loc.value.codeInsee, new Date().toISOString().slice(0, 10))
    : undefined,
)
const finExperimentation = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(
  new Date(`${FIN_EXPERIMENTATION}T12:00:00`),
)
const libellePieces = computed(() =>
  loc.value.typeBien === 'maison'
    ? 'maison'
    : loc.value.pieces >= 3
      ? 'appartement de 3 pièces ou plus'
      : loc.value.pieces >= 1
        ? 'appartement de 1 ou 2 pièces'
        : 'appartement',
)
</script>

<template>
  <div class="solid-card space-y-4 rounded-control p-4 sm:p-5">
    <div>
      <h3 class="font-semibold tracking-tight">Estimer le loyer d’après la commune</h3>
      <p class="mt-1 text-xs text-muted">
        Le loyer de marché des annonces, d’après la carte des loyers {{ MILLESIME_LOYERS }}. La
        commune est cherchée dans votre navigateur, sans être envoyée nulle part.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="relative sm:col-span-2">
        <label :for="idChamp" class="block text-sm font-semibold">Commune</label>
        <input
          :id="idChamp"
          v-model="saisie"
          type="text"
          role="combobox"
          autocomplete="off"
          spellcheck="false"
          class="input mt-2"
          placeholder="Nom ou code INSEE, « Paris 11 », « Saint-Denis 93 »"
          aria-autocomplete="list"
          :aria-expanded="ouvert && resultats.length > 0"
          :aria-controls="idListe"
          :aria-activedescendant="ouvert && resultats.length ? `${idListe}-${actif}` : undefined"
          @focus="preparer"
          @input="saisir"
          @keydown="clavier"
          @blur="ouvert = false"
        />
        <ul
          v-show="ouvert && resultats.length"
          :id="idListe"
          role="listbox"
          :aria-label="`Communes correspondant à ${saisie}`"
          class="glass-floating absolute inset-x-0 z-20 mt-2 max-h-72 overflow-auto rounded-control p-1.5"
        >
          <li
            v-for="(c, i) in resultats"
            :id="`${idListe}-${i}`"
            :key="c.code"
            role="option"
            :aria-selected="i === actif"
            class="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-chip px-3 text-sm"
            :class="i === actif ? 'bg-accent-tint text-label' : 'text-label'"
            @mousedown.prevent="choisir(c)"
            @mousemove="actif = i"
          >
            <span>{{ c.nom }}</span>
            <span class="numeric text-xs text-muted">{{ c.departement }}</span>
          </li>
        </ul>
        <p v-if="etatIndex === 'chargement'" class="mt-1.5 text-xs text-muted">
          Chargement de la liste des communes…
        </p>
        <p v-else-if="etatIndex === 'erreur'" class="mt-1.5 text-xs text-loss">
          La liste des communes n’a pas pu être chargée. Vérifiez la connexion et réessayez.
        </p>
        <p
          v-else-if="ouvert && index && saisie.trim().length >= 2 && !resultats.length"
          class="mt-1.5 text-xs text-muted"
        >
          Aucune commune ne correspond.
        </p>
      </div>
      <div class="sm:col-span-2">
        <ChoixSegmente v-model="loc.typeBien" label="Type de bien" :options="optionsType" />
      </div>
      <ChampNombre v-model="loc.surface" label="Surface habitable" suffixe="m²" />
      <ChampNombre
        v-if="loc.typeBien === 'appartement'"
        v-model="loc.pieces"
        label="Pièces principales"
        suffixe="pièces"
        entier
        aide="Hors cuisine, salle de bain et entrée."
      />
      <ChampNombre
        v-model="loc.chargesRecuperables"
        label="Charges refacturées au locataire"
        suffixe="€ / mois"
        aide="Provisions pour charges payées par le locataire : la carte donne des loyers charges comprises."
      />
    </div>

    <p v-if="etatDonnees === 'erreur'" class="text-sm text-loss">
      Les loyers de ce département n’ont pas pu être chargés. Vérifiez la connexion et réessayez.
    </p>

    <div v-if="estimation" class="space-y-3 rounded-control bg-field p-4" aria-live="polite">
      <p class="text-sm">
        Loyer de marché pour un {{ libellePieces }} vide de {{ nombreFr(loc.surface) }} m² à
        {{ loc.nomCommune }} :
      </p>
      <p>
        <span class="numeric headline text-3xl text-link">{{ euros(estimation.mensuel) }}</span>
        <span class="text-sm text-muted"> par mois, charges comprises</span>
      </p>
      <p class="text-sm text-muted">
        Entre <span class="numeric">{{ euros(estimation.bas) }}</span> et
        <span class="numeric">{{ euros(estimation.haut) }}</span> pour la plupart des annonces, soit
        {{ nombreFr(estimation.m2) }} € le m².
      </p>
      <ul class="space-y-1 text-xs text-muted">
        <li v-if="estimation.fiabilite === 2">
          Peu d’annonces dans cette commune : le loyer au m² est celui d’un groupe de communes
          voisines comparables.
        </li>
        <li v-else-if="estimation.fiabilite === 1">
          Estimation fragile : peu d’annonces dans cette commune, ou un modèle qui les explique mal.
        </li>
        <li v-if="estimation.surfaceAtypique">
          Le loyer au m² vaut pour un logement type de {{ estimation.surfaceReference }} m² ; un
          petit logement se loue plus cher au m², un grand moins cher.
        </li>
      </ul>

      <div class="border-t border-separator pt-3 text-sm">
        <p>
          Hors charges : <span class="numeric font-semibold">{{ euros(horsCharges) }}</span>
          <template v-if="meuble">
            ; en meublé, avec votre supplément de
            {{ nombreFr(b.supplementLoyerMeublePourcent) }} % :
            <span class="numeric font-semibold">{{ euros(loyerPropose) }}</span>
          </template>
          par mois.
        </p>
        <button
          type="button"
          class="btn btn-secondary btn-sm mt-3"
          :disabled="dejaRepris"
          @click="reprendre"
        >
          {{
            dejaRepris
              ? 'Loyer repris dans le simulateur'
              : `Utiliser ${euros(loyerPropose)} comme loyer hors charges`
          }}
        </button>
      </div>
    </div>
    <p v-else-if="loc.codeInsee && indicateurs && !(loc.surface > 0)" class="text-sm text-muted">
      Indiquez la surface pour estimer le loyer.
    </p>

    <div
      v-if="encadrement"
      class="flex gap-2 rounded-xl bg-warning-tint px-3 py-2 text-sm text-warning"
      role="note"
    >
      <AppIcon nom="alerte" class="mt-0.5" />
      <div class="space-y-1">
        <p>
          <strong>Loyers encadrés</strong> ({{ encadrement.territoire.nom
          }}<template v-if="encadrement.enPartie"
            >, pour une partie de la commune seulement</template
          >). Le loyer de base ne peut pas dépasser le loyer de référence majoré fixé par arrêté
          préfectoral selon le quartier, l’époque de construction, le nombre de pièces et le type de
          location. Ce plafond prime sur l’estimation ci-dessus.
        </p>
        <p v-if="encadrement.echeancePassee">
          L’expérimentation devait prendre fin le {{ finExperimentation }} : vérifiez sur la fiche
          officielle si elle a été prolongée.
        </p>
        <p v-else>En vigueur jusqu’au {{ finExperimentation }}, sauf prolongation par la loi.</p>
        <a
          :href="encadrement.territoire.fiche"
          target="_blank"
          rel="noopener"
          class="font-semibold underline underline-offset-2"
          >Calculer le plafond sur service-public.gouv.fr</a
        >
      </div>
    </div>

    <p class="text-xs text-muted">
      Loyers d’annonce, pas loyers de baux signés ; l’état du logement, l’étage ou le DPE n’y
      entrent pas.
      <a
        href="https://www.data.gouv.fr/datasets/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025"
        target="_blank"
        rel="noopener"
        class="text-link underline-offset-2 hover:underline"
        >Carte des loyers {{ MILLESIME_LOYERS }}</a
      >, {{ SOURCE_LOYERS }}.
    </p>
  </div>
</template>
