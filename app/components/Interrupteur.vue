<script setup lang="ts">
defineProps<{ label: string; aide?: string }>()
const modele = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="flex cursor-pointer items-start justify-between gap-4">
    <span>
      <span class="block font-semibold">{{ label }}</span>
      <span v-if="aide" class="mt-0.5 block text-sm text-muted">{{ aide }}</span>
    </span>
    <input v-model="modele" type="checkbox" class="switch mt-0.5" />
  </label>
</template>
