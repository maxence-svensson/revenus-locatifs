<script setup lang="ts" generic="T extends string | number">
defineProps<{ label: string; options: { valeur: T; libelle: string }[]; aide?: string }>()
const modele = defineModel<T>({ required: true })
const nom = useId()
</script>

<template>
  <fieldset>
    <legend class="text-sm font-semibold" :class="{ 'sr-only': !label }">
      {{ label || 'Choix' }}
    </legend>
    <div class="segmented" :class="{ 'mt-2': label }">
      <label v-for="o in options" :key="String(o.valeur)">
        <input v-model="modele" type="radio" :name="nom" :value="o.valeur" class="sr-only" />
        {{ o.libelle }}
      </label>
    </div>
    <p v-if="aide" class="mt-1.5 text-xs leading-snug text-muted">{{ aide }}</p>
  </fieldset>
</template>
