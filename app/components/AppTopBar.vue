<script setup lang="ts">
/**
 * Barre du haut, en verre, alignée sur les cartes de la page. Sur ordinateur elle porte la
 * navigation ; sur téléphone, la marque, le rappel du mode démonstration et le thème.
 */
import { ENTREES } from '~/utils/navigation'

const store = useDossierStore()
const route = useRoute()
const { theme, apply } = useTheme()
const scrolled = ref(false)

const suivant = { system: 'light', light: 'dark', dark: 'system' } as const
const icone = computed(
  () =>
    ({ system: 'ecran', light: 'soleil', dark: 'lune' })[theme.value] as
      'ecran' | 'soleil' | 'lune',
)
const libelle = computed(
  () =>
    ({ system: 'Thème : comme le système', light: 'Thème clair', dark: 'Thème sombre' })[
      theme.value
    ],
)

function onScroll() {
  scrolled.value = window.scrollY > 8
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header
    class="sticky top-0 z-30 mx-auto max-w-[72rem] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8 lg:pt-4"
  >
    <div
      class="flex h-14 items-center gap-3 rounded-[22px] px-4 transition-[background,box-shadow,backdrop-filter] duration-300 ease-ios sm:px-3 lg:h-16 lg:gap-4"
      :class="scrolled ? 'glass-floating' : 'glass'"
    >
      <NuxtLink
        to="/"
        class="flex shrink-0 items-center gap-2.5 rounded-control font-semibold tracking-tight sm:px-1"
      >
        <span
          class="flex size-7 items-center justify-center rounded-[9px] bg-linear-to-br from-[#2bb673] to-[#0f766e] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] lg:size-8 lg:rounded-[10px]"
          aria-hidden="true"
        >
          <AppIcon nom="maison" class="size-4" />
        </span>
        Revenus locatifs
      </NuxtLink>

      <nav aria-label="Navigation principale" class="hidden min-w-0 flex-1 lg:block">
        <ul class="flex items-center gap-1">
          <li v-for="e in ENTREES" :key="e.chemin">
            <NuxtLink
              :to="e.chemin"
              class="flex min-h-10 items-center rounded-full px-3 text-[15px] whitespace-nowrap transition-colors duration-200 xl:px-3.5"
              :class="
                route.path === e.chemin
                  ? 'bg-accent-tint font-semibold text-link'
                  : 'text-label hover:bg-field'
              "
              :aria-current="route.path === e.chemin ? 'page' : undefined"
            >
              {{ e.libelle }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <span
        v-if="store.demo"
        class="ml-auto shrink-0 rounded-full bg-warning-tint px-2.5 py-1 text-xs font-semibold text-warning lg:hidden"
        >Démonstration</span
      >
      <button
        type="button"
        class="flex size-10 shrink-0 items-center justify-center rounded-full text-label transition-colors duration-200 hover:bg-field"
        :class="{ 'ml-auto': !store.demo }"
        :title="libelle"
        :aria-label="libelle"
        @click="apply(suivant[theme])"
      >
        <AppIcon :nom="icone" />
      </button>
    </div>
  </header>
</template>
