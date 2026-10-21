<script setup lang="ts">
/**
 * Nue ou meublée ? Les quatre régimes côte à côte sur le même bien : la balance du verdict,
 * étendue à deux paires de barres. Le type saisi est signalé ; l'autre se déduit du supplément
 * de loyer en meublé.
 */
import type { Comparaison } from '#shared/projection/comparaison'

const props = defineProps<{ comparaison: Comparaison }>()
const store = useDossierStore()
const c = computed(() => props.comparaison)
const horizon = computed(() => c.value.nue.annees.length)
const nomType = (t: 'nue' | 'meublee') => (t === 'nue' ? 'nue' : 'meublée')
/** Un loyer déduit du supplément peut avoir des centimes : on les montre. */
const loyerFr = (v: number) => (Number.isInteger(v) ? euros(v) : eurosCentimes(v))

const max = computed(() =>
  Math.max(1, ...c.value.regimes.map((r) => Math.abs(Number(r.total.toString())))),
)
const groupes = computed(() =>
  (['nue', 'meublee'] as const).map((type) => ({
    type,
    nom: type === 'nue' ? 'Location nue' : 'Location meublée',
    choisi: type === c.value.typeChoisi,
    loyer: type === 'nue' ? c.value.loyerMensuelNue : c.value.loyerMensuelMeublee,
    regimes: c.value.regimes
      .filter((r) => r.typeLocation === type)
      .map((r) => {
        const total = Number(r.total.toString())
        return {
          ...r,
          part: Math.abs(total) / max.value,
          negatif: total < 0,
          couleur: r.regime === 'micro' ? 'bg-series-1' : 'bg-series-2',
          gagnant: r.cle === c.value.meilleur.cle,
        }
      }),
  })),
)

const phrase = computed(() => {
  const e = c.value.economieAutreType
  const choisi = c.value.meilleurDuTypeChoisi
  const autre = c.value.meilleurAutreType
  const duree = `sur ${horizon.value} ${horizon.value > 1 ? 'ans' : 'an'}`
  if (e.abs().lessThan(100))
    return `Le ${choisi.nom} et le ${autre.nom} se valent ${duree} : moins de 100 € d’écart entre le meilleur régime de chaque type.`
  if (e.greaterThan(0))
    return `En location ${nomType(autreType.value)}, le ${autre.nom} coûterait ${euros(e)} de moins ${duree} que le ${choisi.nom}, votre meilleur régime en location ${nomType(c.value.typeChoisi)}.`
  return `Votre meilleur régime, le ${choisi.nom}, coûte ${euros(e.abs())} de moins ${duree} que le ${autre.nom}, le meilleur en location ${nomType(autreType.value)}.`
})
const autreType = computed(() => (c.value.typeChoisi === 'nue' ? 'meublee' : 'nue'))

function basculer() {
  store.basculerType()
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

const attention = [
  'Un meublé doit être équipé selon la liste du décret du 31 juillet 2015 ; le bail est d’un an (neuf mois pour un étudiant), contre trois ans en location nue.',
  'Le loueur en meublé déclare son activité au guichet unique des formalités d’entreprises dans les quinze jours, reçoit un numéro SIRET et devient redevable de la CFE.',
  'Au réel en meublé, la liasse 2031 se télétransmet, en général par un expert-comptable, et les amortissements déduits se réintègrent dans la plus-value à la revente.',
]
</script>

<template>
  <section class="glass-strong rounded-section p-6 sm:p-8" aria-labelledby="comparaison-titre">
    <p class="eyebrow">Nue ou meublée ?</p>
    <h2 id="comparaison-titre" class="headline mt-1 text-2xl sm:text-3xl">
      Les quatre régimes côte à côte
    </h2>
    <p class="mt-2 max-w-prose text-sm text-muted">
      Même bien, même foyer, mêmes charges et même emprunt.
      <template v-if="c.supplementLoyerPourcent > 0">
        Loyer de {{ loyerFr(c.loyerMensuelNue) }} par mois en nu et
        {{ loyerFr(c.loyerMensuelMeublee) }} en meublé, soit
        {{ nombreFr(c.supplementLoyerPourcent) }} % de plus.
      </template>
      <template v-else>
        Même loyer dans les deux cas : indiquez un supplément de loyer en meublé dans le simulateur
        pour comparer à loyers réalistes.
      </template>
    </p>

    <div class="mt-6 grid gap-6 md:grid-cols-2">
      <div
        v-for="g in groupes"
        :key="g.type"
        class="rounded-card p-4 sm:p-5"
        :class="g.choisi ? 'solid-card' : 'border border-separator'"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="font-semibold tracking-tight">{{ g.nom }}</h3>
          <span
            v-if="g.choisi"
            class="rounded-full bg-accent-tint px-2 py-0.5 text-xs font-semibold text-link"
            >Votre saisie</span
          >
          <span v-else class="text-xs text-muted">{{ loyerFr(g.loyer) }} / mois</span>
        </div>
        <ul class="mt-4 space-y-3" :aria-label="`Totaux par régime, ${g.nom.toLowerCase()}`">
          <li v-for="r in g.regimes" :key="r.cle">
            <div class="flex items-baseline justify-between gap-3 text-sm">
              <span class="font-semibold first-letter:uppercase">{{ r.nom }}</span>
              <span class="numeric flex items-center gap-2">
                <span
                  v-if="r.gagnant"
                  class="rounded-full bg-success-tint px-2 py-0.5 text-xs font-semibold text-gain"
                  >Le moins cher</span
                >
                <span v-if="!r.applicable" class="text-xs text-muted">non applicable</span>
                <span class="font-semibold" :class="{ 'text-muted line-through': !r.applicable }">{{
                  euros(r.total)
                }}</span>
              </span>
            </div>
            <div class="mt-1.5 h-2.5 overflow-hidden rounded-full bg-field">
              <div
                class="balance-bar h-full rounded-full"
                :class="[r.negatif ? 'bg-gain' : r.couleur, { 'opacity-30': !r.applicable }]"
                :style="{ width: `${Math.max(2, r.part * 100)}%` }"
              ></div>
            </div>
            <p v-if="!r.applicable && r.motifInapplicable" class="mt-1 text-xs text-muted">
              {{ r.motifInapplicable }}
            </p>
          </li>
        </ul>
      </div>
    </div>

    <p class="mt-6 max-w-prose text-pretty">{{ phrase }}</p>
    <p v-if="groupes.some((g) => g.regimes.some((r) => r.negatif))" class="mt-2 text-xs text-muted">
      Une barre verte est un total négatif : le régime fait économiser plus d’impôt qu’il n’en
      coûte.
    </p>
    <button type="button" class="btn btn-secondary mt-4" @click="basculer">
      Voir le détail en location {{ nomType(autreType) }}
    </button>

    <details class="mt-6 text-sm">
      <summary class="cursor-pointer font-semibold text-link">
        Ce que change le meublé, au-delà de l’impôt
      </summary>
      <ul class="mt-3 space-y-2 text-muted">
        <li v-for="a in attention" :key="a" class="flex gap-2">
          <AppIcon nom="coche" class="mt-0.5 shrink-0" />
          <span>{{ a }}</span>
        </li>
      </ul>
    </details>
  </section>
</template>
