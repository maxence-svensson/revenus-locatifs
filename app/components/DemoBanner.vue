<script setup lang="ts">
/** Rappel permanent du mode démonstration : les données affichées sont fictives. */
const store = useDossierStore()
</script>

<template>
  <div
    v-if="store.demo"
    class="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-card bg-warning-tint px-5 py-4 text-sm"
    role="status"
  >
    <p>
      <span class="font-semibold text-warning">Mode démonstration.</span>
      Ces données sont fictives : un T2 imaginaire, pour essayer. Modifiez un champ et il devient
      votre dossier.
    </p>
    <button type="button" class="btn btn-secondary btn-sm" @click="store.reinitialiser()">
      Quitter la démonstration
    </button>
  </div>
</template>
