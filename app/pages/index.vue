<script setup lang="ts">
const store = useDossierStore()
const router = useRouter()
useSeoMeta({ title: 'Revenus locatifs : micro ou réel ?' })

async function essayer() {
  store.chargerExemple()
  await router.push('/resultat')
}
</script>

<template>
  <div class="space-y-10">
    <section class="pt-6 sm:pt-12">
      <p class="titre-section">Location nue ou meublée</p>
      <h1 class="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
        Micro ou réel ? La réponse chiffrée, année par année.
      </h1>
      <p class="text-texte-doux mt-4 max-w-2xl text-base sm:text-lg">
        Saisissez votre bien, ses loyers, ses charges et son emprunt. Vous obtenez l’impôt dans
        chaque régime sur dix ans, le régime qui coûte le moins cher, et les cases à reporter sur la
        déclaration.
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <NuxtLink to="/simulateur" class="bouton-principal">{{
          store.touche ? 'Reprendre ma saisie' : 'Commencer'
        }}</NuxtLink>
        <button type="button" class="bouton-secondaire" @click="essayer">Voir un exemple</button>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <div class="carte">
        <h2 class="font-semibold">Vos données restent chez vous</h2>
        <p class="text-texte-doux mt-1 text-sm">
          Tout se calcule dans votre navigateur. Aucun compte, aucun envoi, aucun serveur qui reçoit
          vos montants.
        </p>
      </div>
      <div class="carte">
        <h2 class="font-semibold">Le calcul officiel, ligne par ligne</h2>
        <p class="text-texte-doux mt-1 text-sm">
          Déficit foncier et son plafond, amortissements plafonnés au résultat, CSG déductible :
          chaque règle cite sa source et a son test.
        </p>
      </div>
      <div class="carte">
        <h2 class="font-semibold">Dix ans, pas une année</h2>
        <p class="text-texte-doux mt-1 text-sm">
          Le réel gagne souvent l’année des travaux et perd ensuite. La projection montre quand la
          balance bascule.
        </p>
      </div>
    </section>

    <section class="carte-pleine">
      <h2 class="font-semibold">Ce que l’outil ne fait pas</h2>
      <ul class="text-texte-doux mt-2 grid gap-1 text-sm sm:grid-cols-2">
        <li>Les sociétés à l’impôt sur les sociétés.</li>
        <li>Les meublés de tourisme et chambres d’hôtes.</li>
        <li>Les dispositifs Pinel, Denormandie, Malraux, Loc’Avantages.</li>
        <li>La plus-value à la revente et la réintégration des amortissements.</li>
        <li>Les loueurs en meublé professionnels (LMP).</li>
        <li>Plusieurs biens dans un même dossier : un bien à la fois.</li>
      </ul>
      <NuxtLink to="/methode" class="bouton-discret mt-3 -ml-3"
        >Lire la méthode et les sources</NuxtLink
      >
    </section>
  </div>
</template>
