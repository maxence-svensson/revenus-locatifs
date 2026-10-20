<script setup lang="ts">
import { casesPour } from '#shared/tax/cases'

const store = useDossierStore()
useSeoMeta({ title: 'Résultat · Revenus locatifs' })

const p = computed(() => store.projection)
const anneeChoisie = ref<number | null>(null)
const ligne = computed(
  () => p.value.annees.find((a) => a.annee === anneeChoisie.value) ?? p.value.annees[0]!,
)
const regimeCases = ref<'micro' | 'reel'>('reel')
watch(
  () => p.value.recommandation,
  (r) => {
    regimeCases.value = r === 'micro' ? 'micro' : 'reel'
  },
  { immediate: true },
)
const cases = computed(() => casesPour(ligne.value, regimeCases.value))
const optionsRegime = computed(() => [
  {
    valeur: 'micro' as const,
    libelle: p.value.typeLocation === 'nue' ? 'Micro-foncier' : 'Micro-BIC',
  },
  { valeur: 'reel' as const, libelle: p.value.typeLocation === 'nue' ? 'Réel' : 'LMNP réel' },
])
const hypotheses = computed(() => {
  const b = store.dossier.bien
  const h = [
    `Tranche marginale de ${store.dossier.foyer.tmi} % sur toute la période.`,
    `Loyers revalorisés de ${nombreFr(b.revalorisationLoyersPourcent)} % par an, charges de ${nombreFr(b.revalorisationChargesPourcent)} %.`,
  ]
  if (b.vacanceMoisParAn > 0) h.push(`${nombreFr(b.vacanceMoisParAn)} mois de vacance par an.`)
  if (b.emprunt.actif)
    h.push(
      `Emprunt de ${euros(b.emprunt.capital)} à ${nombreFr(b.emprunt.tauxAnnuel)} % sur ${b.emprunt.dureeMois} mois.`,
    )
  h.push('Règles des revenus 2025, appliquées à toutes les années projetées.')
  return h
})
</script>

<template>
  <div v-if="!store.renseigne" class="carte text-center">
    <p class="text-texte-doux">Aucun bien renseigné pour l’instant.</p>
    <div class="mt-4 flex justify-center gap-3">
      <NuxtLink to="/simulateur" class="bouton-principal">Saisir mon bien</NuxtLink>
      <button type="button" class="bouton-secondaire" @click="store.chargerExemple()">
        Voir un exemple
      </button>
    </div>
  </div>
  <div v-else class="space-y-8">
    <PageHeader
      :titre="store.dossier.bien.nom || 'Résultat'"
      :sous-titre="`${store.dossier.bien.typeLocation === 'nue' ? 'Location nue' : 'Location meublée non professionnelle'}, de ${p.annees[0]!.annee} à ${p.annees.at(-1)!.annee}.`"
    >
      <template #actions>
        <NuxtLink to="/simulateur" class="bouton-secondaire">Modifier</NuxtLink>
      </template>
    </PageHeader>

    <div class="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
      <div class="space-y-4">
        <ResultatVerdict :projection="p" />
        <Avertissements :messages="p.avertissements" />
        <div class="carte">
          <h2 class="titre-section mb-2">Hypothèses</h2>
          <ul class="text-texte-doux space-y-1 text-sm">
            <li v-for="h in hypotheses" :key="h">{{ h }}</li>
          </ul>
        </div>
      </div>
      <section class="carte">
        <h2 class="titre-section mb-3">Année par année</h2>
        <ProjectionChart :projection="p" />
        <div class="mt-4">
          <ProjectionTable :projection="p" />
        </div>
      </section>
    </div>

    <section>
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold">Le détail d’une année</h2>
        <label class="flex items-center gap-2 text-sm">
          <span class="text-texte-doux">Année</span>
          <select v-model="anneeChoisie" class="champ w-auto">
            <option v-for="a in p.annees" :key="a.annee" :value="a.annee">{{ a.annee }}</option>
          </select>
        </label>
      </div>
      <DetailAnnee :ligne="ligne" />
    </section>

    <section class="carte">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold">Les cases à reporter pour {{ ligne.annee }}</h2>
        <ChoixSegmente v-model="regimeCases" label="" :options="optionsRegime" />
      </div>
      <CasesTable :cases="cases" />
      <p class="text-texte-doux mt-3 text-xs">
        Numéros des formulaires des revenus 2025 : vérifiez-les sur la notice de l’année, ils
        changent parfois de place. Au réel en meublé, la liasse 2031 et ses annexes 2033 se
        télétransmettent à part, en général par un expert-comptable.
      </p>
    </section>

    <section v-if="p.plan.length" class="carte">
      <h2 class="mb-3 text-lg font-semibold">Plan d’amortissement</h2>
      <PlanAmortissementTable :plan="p.plan" />
    </section>
  </div>
</template>
