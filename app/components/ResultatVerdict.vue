<script setup lang="ts">
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
</script>

<template>
  <div class="carte-pleine border-accent/40 space-y-3">
    <p class="titre-section">Sur {{ horizon }} {{ horizon > 1 ? 'ans' : 'an' }}</p>
    <h2 class="text-xl font-bold tracking-tight sm:text-2xl">{{ titre }}</h2>
    <p v-if="p.recommandation !== 'indifferent'" class="text-texte-doux text-sm">
      <span class="text-texte text-2xl font-bold tabular-nums">{{ euros(economie) }}</span>
      d’impôt et de prélèvements en moins qu’avec
      {{ p.recommandation === 'reel' ? `le ${nomMicro}` : `le ${nomReel}` }}, à tranche constante.
    </p>
    <p v-else class="text-texte-doux text-sm">
      Moins de 100 € d’écart cumulé : le micro, plus simple, se défend.
    </p>
    <div class="grid grid-cols-2 gap-3 pt-1 text-sm">
      <div class="bg-fond rounded-xl p-3">
        <p class="text-micro text-xs font-semibold uppercase">{{ nomMicro }}</p>
        <p class="mt-1 text-lg font-semibold tabular-nums">{{ euros(p.totalMicro) }}</p>
      </div>
      <div class="bg-fond rounded-xl p-3">
        <p class="text-reel text-xs font-semibold uppercase">{{ nomReel }}</p>
        <p class="mt-1 text-lg font-semibold tabular-nums">{{ euros(p.totalReel) }}</p>
      </div>
    </div>
    <p
      v-if="!compact && p.premiereAnneeMicroMoinsCher && p.recommandation === 'reel'"
      class="text-texte-doux text-xs"
    >
      Le micro redevient moins cher à partir de {{ p.premiereAnneeMicroMoinsCher }} : vérifiez
      chaque année si un retour au micro vaut le coup, une fois l’engagement passé.
    </p>
    <slot />
  </div>
</template>
