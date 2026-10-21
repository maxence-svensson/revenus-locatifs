<script setup lang="ts">
import type { Projection } from '#shared/projection/projection'
const props = defineProps<{ projection: Projection }>()
const nomMicro = computed(() =>
  props.projection.typeLocation === 'nue' ? 'Micro-foncier' : 'Micro-BIC',
)
const nomReel = computed(() => (props.projection.typeLocation === 'nue' ? 'Réel' : 'LMNP réel'))
</script>

<template>
  <div class="overflow-x-auto">
    <table class="tableau">
      <thead>
        <tr>
          <th>Année</th>
          <th class="num">Loyers</th>
          <th class="num">{{ nomMicro }}</th>
          <th class="num">{{ nomReel }}</th>
          <th class="num">Écart</th>
          <th class="num">Cumul {{ nomMicro }}</th>
          <th class="num">Cumul {{ nomReel }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in projection.annees" :key="a.annee">
          <td class="font-medium tabular-nums">{{ a.annee }}</td>
          <td class="num">{{ euros(a.brut.loyers) }}</td>
          <td class="num">{{ euros(a.micro.net) }}</td>
          <td class="num">{{ euros(a.reel.net) }}</td>
          <td
            class="num font-medium"
            :class="
              a.ecart.greaterThan(0) ? 'text-series-2' : a.ecart.lessThan(0) ? 'text-series-1' : ''
            "
          >
            {{ eurosSigne(a.ecart) }}
          </td>
          <td class="num text-muted">{{ euros(a.micro.cumul) }}</td>
          <td class="num text-muted">{{ euros(a.reel.cumul) }}</td>
        </tr>
      </tbody>
    </table>
    <p class="text-muted mt-2 text-xs">
      Un écart positif signifie que le réel coûte moins cher cette année-là. Les montants
      comprennent l’impôt que le bien ajoute au foyer, au barème, les prélèvements sociaux,
      l’économie d’un déficit imputé sur le revenu global et celle de la CSG déductible l’année
      suivante.
    </p>
  </div>
</template>
