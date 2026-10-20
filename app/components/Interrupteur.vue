<script setup lang="ts">
defineProps<{ label: string; aide?: string }>()
const modele = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="flex cursor-pointer items-start justify-between gap-4">
    <span>
      <span class="text-texte block text-sm font-medium">{{ label }}</span>
      <span v-if="aide" class="text-texte-doux block text-xs leading-snug">{{ aide }}</span>
    </span>
    <button
      type="button"
      role="switch"
      :aria-checked="modele"
      class="relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition"
      :class="modele ? 'bg-accent' : 'bg-bordure'"
      @click="modele = !modele"
    >
      <span
        class="absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition"
        :class="{ 'translate-x-5': modele }"
      />
    </button>
  </label>
</template>
