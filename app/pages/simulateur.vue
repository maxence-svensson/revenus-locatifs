<script setup lang="ts">
const store = useDossierStore()
useSeoMeta({ title: 'Simulateur' })
</script>

<template>
  <div>
    <PageHeader
      titre="Votre bien"
      sous-titre="Les montants sont annuels sauf mention contraire. Le résultat se met à jour à chaque saisie."
    >
      <template #actions>
        <button
          v-if="!store.touche"
          type="button"
          class="btn btn-secondary"
          @click="store.chargerExemple()"
        >
          Remplir avec l’exemple
        </button>
        <button v-else type="button" class="btn btn-secondary" @click="store.reinitialiser()">
          Tout effacer
        </button>
      </template>
    </PageHeader>
    <div class="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div class="min-w-0"><FormulaireBien /></div>
      <aside class="min-w-0 space-y-4 lg:sticky lg:top-24">
        <ResultatVerdict v-if="store.renseigne" :projection="store.projection" compact>
          <NuxtLink to="/resultat" class="btn btn-primary mt-6 w-full">Voir le détail</NuxtLink>
        </ResultatVerdict>
        <div v-else class="glass rounded-card p-5 sm:p-6 text-muted text-sm">
          Renseignez au moins le loyer mensuel pour voir un premier résultat.
        </div>
        <ul v-if="store.erreurs.length" class="text-loss text-xs">
          <li v-for="e in store.erreurs" :key="e">{{ e }}</li>
        </ul>
      </aside>
    </div>
  </div>
</template>
