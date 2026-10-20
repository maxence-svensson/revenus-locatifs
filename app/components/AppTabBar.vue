<script setup lang="ts">
/** Barre d'onglets en verre, en bas de l'écran sur téléphone et petite tablette. */
import { ENTREES } from '~/utils/navigation'
const route = useRoute()
</script>

<template>
  <nav
    aria-label="Navigation principale"
    class="glass-floating fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-[24px] px-1.5 py-1.5 lg:hidden"
  >
    <ul class="grid grid-cols-4">
      <li v-for="e in ENTREES" :key="e.chemin">
        <NuxtLink
          :to="e.chemin"
          class="flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-control text-[11px] font-medium transition-colors duration-200"
          :class="route.path === e.chemin ? 'text-link' : 'text-muted'"
          :aria-current="route.path === e.chemin ? 'page' : undefined"
        >
          <AppIcon :nom="e.icone" class="size-6" />
          {{ e.court }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
