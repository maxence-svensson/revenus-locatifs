<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    suffixe?: string
    aide?: string
    min?: number
    max?: number
    step?: number | 'any'
    entier?: boolean
  }>(),
  { suffixe: '€', aide: undefined, min: 0, max: undefined, step: 'any', entier: false },
)
const modele = defineModel<number>({ required: true })
const id = useId()
const texte = computed({
  get: () => (modele.value === 0 && !props.entier ? '' : String(modele.value)),
  set: (v: string) => {
    const n = Number(String(v).replace(',', '.'))
    modele.value = Number.isFinite(n) ? n : 0
  },
})
</script>

<template>
  <div>
    <label :for="id" class="text-texte mb-1 block text-sm font-medium">{{ label }}</label>
    <div class="relative">
      <input
        :id="id"
        v-model="texte"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        class="champ pr-10"
        :placeholder="entier ? undefined : '0'"
        :aria-describedby="aide ? `${id}-aide` : undefined"
      />
      <span
        v-if="suffixe"
        class="text-texte-doux pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm"
        >{{ suffixe }}</span
      >
    </div>
    <p v-if="aide" :id="`${id}-aide`" class="text-texte-doux mt-1 text-xs leading-snug">
      {{ aide }}
    </p>
  </div>
</template>
