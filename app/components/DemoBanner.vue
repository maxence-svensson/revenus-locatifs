<script setup lang="ts">
const store = useDossierStore()
</script>

<template>
  <div
    v-if="store.demo"
    class="bg-attention-doux text-attention border-bordure border-b px-4 py-2 text-center text-sm font-medium"
  >
    Exemple fictif affiché : un T2 imaginaire, pour essayer. Modifiez un champ ou
    <button type="button" class="underline underline-offset-2" @click="store.reinitialiser()">
      repartez de zéro</button
    >.
  </div>
</template>
