<script setup lang="ts">
import type { Projection } from '#shared/projection/projection'
const props = defineProps<{ projection: Projection }>()

const largeur = 720
const hauteur = 260
const marge = { haut: 16, bas: 28, gauche: 56, droite: 8 }

const donnees = computed(() =>
  props.projection.annees.map((a) => ({
    annee: a.annee,
    micro: Number(a.micro.net.toString()),
    reel: Number(a.reel.net.toString()),
  })),
)
const maxAbs = computed(() =>
  Math.max(1, ...donnees.value.flatMap((d) => [d.micro, d.reel]).map(Math.abs)),
)
const minVal = computed(() => Math.min(0, ...donnees.value.flatMap((d) => [d.micro, d.reel])))
const maxVal = computed(() => Math.max(0, ...donnees.value.flatMap((d) => [d.micro, d.reel])))
const zoneH = hauteur - marge.haut - marge.bas
const zoneL = largeur - marge.gauche - marge.droite
const echelle = computed(() => zoneH / Math.max(1, maxVal.value - minVal.value))
const y = (v: number) => marge.haut + (maxVal.value - v) * echelle.value
const y0 = computed(() => y(0))
const groupe = computed(() => zoneL / Math.max(1, donnees.value.length))
const barre = computed(() => Math.min(28, (groupe.value - 8) / 2))

const graduations = computed(() => {
  const pas = pasArrondi(maxAbs.value)
  const res: number[] = []
  for (let v = Math.ceil(minVal.value / pas) * pas; v <= maxVal.value; v += pas) res.push(v)
  return res
})
function pasArrondi(m: number) {
  const brut = m / 3
  const puissance = 10 ** Math.floor(Math.log10(brut))
  const n = brut / puissance
  const base = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10
  return base * puissance
}
const nomMicro = computed(() =>
  props.projection.typeLocation === 'nue' ? 'Micro-foncier' : 'Micro-BIC',
)
const nomReel = computed(() => (props.projection.typeLocation === 'nue' ? 'Réel' : 'LMNP réel'))
</script>

<template>
  <figure>
    <figcaption class="mb-2 flex flex-wrap items-center gap-4 text-xs">
      <span class="flex items-center gap-1.5"
        ><span class="bg-series-1 inline-block size-3 rounded-sm" />{{ nomMicro }}</span
      >
      <span class="flex items-center gap-1.5"
        ><span class="bg-series-2 inline-block size-3 rounded-sm" />{{ nomReel }}</span
      >
      <span class="text-muted"
        >Impôt et prélèvements par année, nets des économies. Une barre sous zéro est une économie
        d’impôt.</span
      >
    </figcaption>
    <svg
      :viewBox="`0 0 ${largeur} ${hauteur}`"
      class="h-auto w-full"
      role="img"
      :aria-label="`Impôt par année, ${nomMicro} contre ${nomReel}`"
    >
      <g v-for="g in graduations" :key="g">
        <line
          :x1="marge.gauche"
          :x2="largeur - marge.droite"
          :y1="y(g)"
          :y2="y(g)"
          class="stroke-separator"
          stroke-width="1"
        />
        <text
          :x="marge.gauche - 6"
          :y="y(g) + 4"
          text-anchor="end"
          class="fill-muted text-[11px] tabular-nums"
        >
          {{ nombreFr(g) }}
        </text>
      </g>
      <line
        :x1="marge.gauche"
        :x2="largeur - marge.droite"
        :y1="y0"
        :y2="y0"
        class="stroke-muted"
        stroke-width="1"
      />
      <g v-for="(d, i) in donnees" :key="d.annee">
        <rect
          :x="marge.gauche + i * groupe + groupe / 2 - barre - 2"
          :y="Math.min(y(d.micro), y0)"
          :width="barre"
          :height="Math.max(1, Math.abs(y(d.micro) - y0))"
          class="fill-series-1"
          rx="3"
        >
          <title>{{ d.annee }} · {{ nomMicro }} : {{ euros(d.micro) }}</title>
        </rect>
        <rect
          :x="marge.gauche + i * groupe + groupe / 2 + 2"
          :y="Math.min(y(d.reel), y0)"
          :width="barre"
          :height="Math.max(1, Math.abs(y(d.reel) - y0))"
          class="fill-series-2"
          rx="3"
        >
          <title>{{ d.annee }} · {{ nomReel }} : {{ euros(d.reel) }}</title>
        </rect>
        <text
          v-if="donnees.length <= 12 || i % Math.ceil(donnees.length / 12) === 0"
          :x="marge.gauche + i * groupe + groupe / 2"
          :y="hauteur - 8"
          text-anchor="middle"
          class="fill-muted text-[11px] tabular-nums"
        >
          {{ d.annee }}
        </text>
      </g>
    </svg>
  </figure>
</template>
