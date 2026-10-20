<script setup lang="ts" generic="T extends string | number">
defineProps<{ label: string; options: { valeur: T; libelle: string }[]; aide?: string }>()
const modele = defineModel<T>({ required: true })
</script>

<template>
  <div>
    <p class="text-texte mb-1 block text-sm font-medium">{{ label }}</p>
    <div class="segment flex-wrap" role="group" :aria-label="label">
      <button
        v-for="o in options"
        :key="String(o.valeur)"
        type="button"
        :aria-pressed="modele === o.valeur"
        @click="modele = o.valeur"
      >
        {{ o.libelle }}
      </button>
    </div>
    <p v-if="aide" class="text-texte-doux mt-1 text-xs leading-snug">{{ aide }}</p>
  </div>
</template>
