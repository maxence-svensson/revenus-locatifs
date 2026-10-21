<script setup lang="ts">
const store = useDossierStore()
const router = useRouter()
useSeoMeta({ title: 'Revenus locatifs : micro ou réel, la réponse chiffrée' })

async function essayer() {
  store.chargerExemple()
  await router.push('/resultat')
}
</script>

<template>
  <div class="space-y-12 lg:space-y-16">
    <section class="pt-4 sm:pt-10">
      <p class="enter eyebrow" style="--delay: 0ms">Location nue ou meublée</p>
      <h1 class="enter text-hero mt-3 max-w-4xl text-balance" style="--delay: 80ms">
        Micro ou réel ? La réponse chiffrée, année par année.
      </h1>
      <p
        class="enter mt-6 max-w-prose text-lg text-pretty text-muted sm:text-xl"
        style="--delay: 160ms"
      >
        Saisissez votre bien, ses loyers, ses charges et son emprunt. Vous obtenez l’impôt dans
        chaque régime sur dix ans, le moins cher des quatre, nue ou meublée, et les cases à reporter
        sur la déclaration.
      </p>
      <div class="enter mt-8 flex flex-wrap gap-3" style="--delay: 240ms">
        <NuxtLink to="/simulateur" class="btn btn-primary">{{
          store.touche ? 'Reprendre ma saisie' : 'Commencer'
        }}</NuxtLink>
        <button type="button" class="btn btn-secondary" @click="essayer">Voir un exemple</button>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <div class="glass rounded-card p-6">
        <AppIcon nom="coche" class="text-link" />
        <h2 class="mt-3 font-semibold tracking-tight">Vos données restent chez vous</h2>
        <p class="mt-1 text-sm text-muted">
          Tout se calcule dans votre navigateur. Aucun compte, aucun envoi, aucun serveur qui reçoit
          vos montants.
        </p>
      </div>
      <div class="glass rounded-card p-6">
        <AppIcon nom="livre" class="text-link" />
        <h2 class="mt-3 font-semibold tracking-tight">Le calcul officiel, ligne par ligne</h2>
        <p class="mt-1 text-sm text-muted">
          Déficit foncier et son plafond, amortissements plafonnés au résultat, CSG déductible :
          chaque règle cite sa source et a son test.
        </p>
      </div>
      <div class="glass rounded-card p-6">
        <AppIcon nom="balance" class="text-link" />
        <h2 class="mt-3 font-semibold tracking-tight">Dix ans, quatre régimes</h2>
        <p class="mt-1 text-sm text-muted">
          Le réel gagne souvent l’année des travaux et perd ensuite. La projection montre quand la
          balance bascule, et ce que donnerait le même bien dans l’autre type de location.
        </p>
      </div>
    </section>

    <section class="solid-card rounded-card p-6 sm:p-8">
      <h2 class="headline text-2xl">Ce que l’outil ne fait pas</h2>
      <ul class="mt-4 grid gap-2 text-muted sm:grid-cols-2">
        <li>Les sociétés à l’impôt sur les sociétés.</li>
        <li>Les meublés de tourisme et chambres d’hôtes.</li>
        <li>Les dispositifs Pinel, Denormandie, Malraux, Loc’Avantages.</li>
        <li>La plus-value à la revente et la réintégration des amortissements.</li>
        <li>Les loueurs en meublé professionnels (LMP).</li>
        <li>Plusieurs biens dans un même dossier : un bien à la fois.</li>
      </ul>
      <NuxtLink to="/methode" class="btn btn-ghost mt-5 -ml-2"
        >Lire la méthode et les sources</NuxtLink
      >
    </section>
  </div>
</template>
