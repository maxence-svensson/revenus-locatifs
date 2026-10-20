<script setup lang="ts">
import { ENTREES } from '~/utils/navigation'
const route = useRoute()
const { theme, choisir } = useTheme()
const suivant = { systeme: 'clair', clair: 'sombre', sombre: 'systeme' } as const
const icone = computed(
  () =>
    ({ systeme: 'ecran', clair: 'soleil', sombre: 'lune' })[theme.value] as
      'ecran' | 'soleil' | 'lune',
)
const libelle = computed(
  () =>
    ({ systeme: 'Thème : comme le système', clair: 'Thème clair', sombre: 'Thème sombre' })[
      theme.value
    ],
)
</script>

<template>
  <header class="bg-surface border-bordure sticky top-0 z-30 border-b backdrop-blur-xl">
    <div class="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
      <NuxtLink to="/" class="flex items-center gap-2 font-semibold tracking-tight">
        <span
          class="bg-accent text-accent-texte grid size-7 place-items-center rounded-lg text-sm font-bold"
          >RL</span
        >
        <span>Revenus locatifs</span>
      </NuxtLink>
      <nav class="ml-4 hidden items-center gap-1 md:flex" aria-label="Pages">
        <NuxtLink
          v-for="e in ENTREES"
          :key="e.chemin"
          :to="e.chemin"
          class="text-texte-doux hover:text-texte rounded-full px-3 py-1.5 text-sm font-medium transition"
          :class="{ 'bg-accent-doux text-texte': route.path === e.chemin }"
          :aria-current="route.path === e.chemin ? 'page' : undefined"
        >
          {{ e.libelle }}
        </NuxtLink>
      </nav>
      <button
        type="button"
        class="bouton-discret ml-auto"
        :title="libelle"
        :aria-label="libelle"
        @click="choisir(suivant[theme])"
      >
        <AppIcon :nom="icone" />
      </button>
    </div>
  </header>
</template>
