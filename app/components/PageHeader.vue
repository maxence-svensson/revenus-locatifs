<script setup lang="ts">
/** Titre de page : un h1, une phrase d'explication, et les actions à droite. */
defineProps<{ titre: string; sousTitre?: string }>()
</script>

<template>
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div class="min-w-0">
      <h1 class="headline text-4xl sm:text-5xl">{{ titre }}</h1>
      <p v-if="sousTitre" class="mt-3 max-w-prose text-lg text-pretty text-muted">
        {{ sousTitre }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex gap-2"><slot name="actions" /></div>
  </header>
</template>
