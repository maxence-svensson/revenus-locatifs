<script setup lang="ts">
import { ENTREES } from '~/utils/navigation'
const route = useRoute()
</script>

<template>
  <nav
    class="bg-surface border-bordure fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    aria-label="Pages"
  >
    <ul class="grid grid-cols-4">
      <li v-for="e in ENTREES" :key="e.chemin">
        <NuxtLink
          :to="e.chemin"
          class="text-texte-doux flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
          :class="{ 'text-accent': route.path === e.chemin }"
          :aria-current="route.path === e.chemin ? 'page' : undefined"
        >
          <AppIcon :nom="e.icone" />
          {{ e.court }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
