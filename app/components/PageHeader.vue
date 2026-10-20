<script setup lang="ts">
defineProps<{ titre: string; sousTitre?: string }>()
</script>

<template>
  <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ titre }}</h1>
      <p v-if="sousTitre" class="text-texte-doux mt-1 max-w-2xl text-sm sm:text-base">
        {{ sousTitre }}
      </p>
    </div>
    <div class="flex gap-2"><slot name="actions" /></div>
  </div>
</template>
