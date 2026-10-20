<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    suffixe?: string
    aide?: string
    entier?: boolean
  }>(),
  { suffixe: '€', aide: undefined, entier: false },
)
const modele = defineModel<number>({ required: true })
const id = useId()
const texte = computed({
  get: () => (modele.value === 0 && !props.entier ? '' : String(modele.value)),
  set: (v: string) => {
    const n = Number(String(v).replace(',', '.').replace(/\s/g, ''))
    modele.value = Number.isFinite(n) ? n : 0
  },
})
</script>

<template>
  <label class="block" :for="id">
    <span class="text-sm font-semibold">{{ label }}</span>
    <span class="relative mt-2 block">
      <input
        :id="id"
        v-model="texte"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        class="input numeric"
        :class="{ 'pr-14': suffixe && suffixe.length <= 2, 'pr-28': suffixe && suffixe.length > 2 }"
        :placeholder="entier ? undefined : '0'"
        :aria-describedby="aide ? `${id}-aide` : undefined"
      />
      <span
        v-if="suffixe"
        class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted"
        >{{ suffixe }}</span
      >
    </span>
    <span v-if="aide" :id="`${id}-aide`" class="mt-1.5 block text-xs leading-snug text-muted">{{
      aide
    }}</span>
  </label>
</template>
