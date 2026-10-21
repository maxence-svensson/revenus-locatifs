<script setup lang="ts">
/**
 * Le verdict, et la balance : deux barres à l'échelle des totaux de chaque régime. C'est la
 * signature du site, là où Crypto-plusvalue a son surligneur.
 */
import type { Projection } from '#shared/projection/projection'

const props = defineProps<{ projection: Projection; compact?: boolean }>()
const p = computed(() => props.projection)
const nomMicro = computed(() => (p.value.typeLocation === 'nue' ? 'micro-foncier' : 'micro-BIC'))
const nomReel = computed(() => (p.value.typeLocation === 'nue' ? 'réel foncier' : 'LMNP au réel'))
const horizon = computed(() => p.value.annees.length)
const titre = computed(() => {
  if (!p.value.microApplicablePremiereAnnee) return `Le ${nomReel.value} s’impose`
  if (p.value.recommandation === 'indifferent') return 'Les deux régimes se valent'
  return p.value.recommandation === 'reel'
    ? `Le ${nomReel.value} est plus avantageux`
    : `Le ${nomMicro.value} est plus avantageux`
})
const economie = computed(() => p.value.economieReel.abs())

const barres = computed(() => {
  const micro = Number(p.value.totalMicro.toString())
  const reel = Number(p.value.totalReel.toString())
  const max = Math.max(Math.abs(micro), Math.abs(reel), 1)
  return [
    {
      cle: 'micro',
      nom: nomMicro.value,
      total: p.value.totalMicro,
      part: Math.abs(micro) / max,
      negatif: micro < 0,
      couleur: 'bg-series-1',
      gagnant: p.value.recommandation === 'micro',
    },
    {
      cle: 'reel',
      nom: nomReel.value,
      total: p.value.totalReel,
      part: Math.abs(reel) / max,
      negatif: reel < 0,
      couleur: 'bg-series-2',
      gagnant: p.value.recommandation === 'reel',
    },
  ]
})
</script>

<template>
  <div class="glass-strong rounded-section p-6 sm:p-8">
    <p class="text-sm text-muted">
      Sur {{ horizon }} {{ horizon > 1 ? 'ans' : 'an' }}, au barème de l’impôt
    </p>
    <h2 class="headline mt-1 text-2xl sm:text-3xl">{{ titre }}</h2>
    <p v-if="p.recommandation !== 'indifferent'" class="mt-4">
      <span class="numeric headline text-4xl text-link sm:text-5xl">{{ euros(economie) }}</span>
      <span class="mt-1 block text-sm text-muted">
        d’impôt et de prélèvements en moins qu’avec
        {{ p.recommandation === 'reel' ? `le ${nomMicro}` : `le ${nomReel}` }}.
      </span>
    </p>
    <p v-else class="mt-3 text-sm text-muted">
      Moins de 100 € d’écart cumulé : le micro, plus simple, se défend.
    </p>

    <ul class="mt-6 space-y-3" aria-label="Totaux par régime">
      <li v-for="b in barres" :key="b.cle">
        <div class="flex items-baseline justify-between gap-3 text-sm">
          <span class="font-semibold first-letter:uppercase">{{ b.nom }}</span>
          <span class="numeric flex items-center gap-2">
            <span
              v-if="b.gagnant && p.recommandation !== 'indifferent'"
              class="rounded-full bg-success-tint px-2 py-0.5 text-xs font-semibold text-gain"
              >Le moins cher</span
            >
            <span class="font-semibold">{{ euros(b.total) }}</span>
          </span>
        </div>
        <div class="mt-1.5 h-2.5 overflow-hidden rounded-full bg-field">
          <div
            class="balance-bar h-full rounded-full"
            :class="b.negatif ? 'bg-gain' : b.couleur"
            :style="{ width: `${Math.max(2, b.part * 100)}%` }"
          ></div>
        </div>
      </li>
    </ul>
    <p v-if="barres.some((b) => b.negatif)" class="mt-2 text-xs text-muted">
      Une barre verte est un total négatif : le régime fait économiser plus d’impôt qu’il n’en
      coûte.
    </p>

    <p
      v-if="!compact && p.premiereAnneeMicroMoinsCher && p.recommandation === 'reel'"
      class="mt-4 text-sm text-muted"
    >
      Le micro redevient moins cher à partir de {{ p.premiereAnneeMicroMoinsCher }} : une fois
      l’engagement passé, vérifiez chaque année si un retour au micro vaut le coup.
    </p>
    <slot />
  </div>
</template>
