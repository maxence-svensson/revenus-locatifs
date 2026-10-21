<script setup lang="ts">
import { TRANCHES, NATURES_TRAVAUX, type Tranche, type NatureTravaux } from '#shared/model/dossier'

const store = useDossierStore()
const b = computed(() => store.brouillon.bien)
const f = computed(() => store.brouillon.foyer)
const meuble = computed(() => b.value.typeLocation === 'meublee')

const optionsType = [
  { valeur: 'nue' as const, libelle: 'Location nue' },
  { valeur: 'meublee' as const, libelle: 'Meublée (LMNP)' },
]
const optionsTmi = TRANCHES.map((t) => ({ valeur: t as Tranche, libelle: `${t} %` }))
const naturesLibelles: Record<NatureTravaux, string> = {
  entretien: 'Entretien ou réparation',
  amelioration: 'Amélioration',
  energetique: 'Rénovation énergétique',
  construction: 'Construction ou agrandissement',
}
</script>

<template>
  <div class="space-y-5">
    <section class="glass space-y-5 rounded-card p-5 sm:p-6">
      <h2 class="headline text-xl">Le bien</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label for="nom" class="block text-sm font-semibold">Nom, pour vous repérer</label>
          <input id="nom" v-model="b.nom" type="text" class="input mt-2" maxlength="60" />
        </div>
        <div class="sm:col-span-2">
          <ChoixSegmente
            v-model="b.typeLocation"
            label="Type de location"
            :options="optionsType"
            aide="La location nue relève des revenus fonciers, la location meublée des bénéfices industriels et commerciaux. Les régimes comparés changent avec ce choix."
          />
        </div>
        <ChampNombre
          v-model="b.anneeMiseEnLocation"
          label="Première année de location"
          suffixe=""
          entier
          :min="1990"
          :max="2100"
          aide="Année des premiers loyers, qui est aussi la première année projetée."
        />
        <ChoixSegmente
          v-model="f.tmi"
          label="Tranche marginale d’imposition"
          :options="optionsTmi"
          aide="La tranche la plus haute de votre barème. Le revenu locatif s’y ajoute."
        />
        <ChampNombre
          v-model="b.prixAcquisition"
          label="Prix d’achat"
          aide="Hors frais. Sert à l’amortissement en meublé ; sans effet en location nue."
        />
        <ChampNombre
          v-model="b.fraisAcquisition"
          label="Frais d’acquisition"
          aide="Notaire et agence à l’achat. En meublé au réel, amortis avec le bien."
        />
        <ChampNombre
          v-model="b.partTerrainPourcent"
          label="Part du terrain"
          suffixe="%"
          aide="En meublé, le terrain ne s’amortit pas. 10 à 20 % en ville, davantage pour une maison."
        />
        <ChampNombre
          v-model="b.mobilier"
          label="Valeur du mobilier"
          aide="Meubles et équipements fournis, amortis sur 7 ans en meublé. Compte dans la comparaison nue / meublée."
        />
      </div>
    </section>

    <section class="glass space-y-5 rounded-card p-5 sm:p-6">
      <h2 class="headline text-xl">Loyers</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <ChampNombre
          v-model="b.loyerMensuelHorsCharges"
          label="Loyer mensuel hors charges"
          aide="Les charges refacturées au locataire ne sont pas un revenu."
        />
        <ChampNombre
          v-model="b.vacanceMoisParAn"
          label="Vacance locative"
          suffixe="mois / an"
          :max="12"
          aide="En moyenne, entre deux locataires. 0,5 mois par an est prudent."
        />
        <ChampNombre
          v-model="b.revalorisationLoyersPourcent"
          label="Revalorisation des loyers"
          suffixe="% / an"
          aide="Indice de référence des loyers : autour de 1,5 à 3 % ces dernières années."
        />
        <ChampNombre
          v-model="b.revalorisationChargesPourcent"
          label="Hausse des charges"
          suffixe="% / an"
        />
        <ChampNombre
          v-model="b.supplementLoyerMeublePourcent"
          label="Supplément de loyer en meublé"
          suffixe="%"
          :aide="
            meuble
              ? 'Le loyer saisi est celui du meublé. La comparaison nue / meublée le réduit d’autant pour la location nue. Un meublé se loue souvent 10 à 20 % plus cher.'
              : 'Le loyer saisi est celui du nu. La comparaison nue / meublée l’augmente d’autant pour le meublé, qui se loue souvent 10 à 20 % plus cher.'
          "
        />
      </div>
    </section>

    <section class="glass space-y-5 rounded-card p-5 sm:p-6">
      <h2 class="headline text-xl">Charges annuelles</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <ChampNombre
          v-model="b.taxeFonciere"
          label="Taxe foncière"
          aide="Hors taxe d’enlèvement des ordures ménagères, récupérable sur le locataire."
        />
        <ChampNombre
          v-model="b.assurances"
          label="Assurances"
          aide="Propriétaire non occupant et garantie des loyers impayés."
        />
        <ChampNombre
          v-model="b.fraisGestionPourcent"
          label="Frais de gestion locative"
          suffixe="% des loyers"
          aide="Agence ou plateforme. Laissez 0 si vous gérez vous-même."
        />
        <ChampNombre
          v-model="b.chargesCopropriete"
          label="Charges de copropriété non récupérables"
          aide="La part qui reste au propriétaire : travaux votés, honoraires du syndic, assurance de l’immeuble."
        />
        <ChampNombre
          v-model="b.fraisComptable"
          label="Expert-comptable"
          aide="En meublé au réel, la liasse 2031 se fait rarement sans. Comptez 300 à 700 € par an. Sans effet en location nue."
        />
        <ChampNombre
          v-model="b.cfe"
          label="Cotisation foncière des entreprises"
          aide="Due en meublé, sauf recettes inférieures à 5 000 €. Votre commune fixe le montant. Sans effet en location nue."
        />
      </div>
    </section>

    <section class="glass space-y-5 rounded-card p-5 sm:p-6">
      <div class="flex items-center justify-between">
        <h2 class="headline text-xl">Travaux</h2>
        <button type="button" class="btn btn-ghost btn-sm" @click="store.ajouterTravaux()">
          <AppIcon nom="plus" /> Ajouter
        </button>
      </div>
      <p v-if="b.travaux.length === 0" class="text-muted text-sm">
        Aucun travaux. En location nue, les travaux d’entretien et d’amélioration se déduisent
        l’année où vous les payez ; en meublé, l’amélioration s’amortit.
      </p>
      <ul v-else class="space-y-3">
        <li
          v-for="t in b.travaux"
          :key="t.id"
          class="solid-card grid gap-3 rounded-control p-4 sm:grid-cols-[1fr_7rem_8rem_auto] sm:items-end"
        >
          <div>
            <label :for="`lib-${t.id}`" class="block text-sm font-semibold">Nature</label>
            <select :id="`lib-${t.id}`" v-model="t.nature" class="input mt-2">
              <option v-for="n in NATURES_TRAVAUX" :key="n" :value="n">
                {{ naturesLibelles[n] }}
              </option>
            </select>
            <input
              v-model="t.libelle"
              type="text"
              class="input mt-2"
              placeholder="Libellé (facultatif)"
              maxlength="80"
            />
          </div>
          <ChampNombre v-model="t.annee" label="Année" suffixe="" entier :min="1990" :max="2100" />
          <ChampNombre v-model="t.montant" label="Montant" />
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-danger self-end"
            :aria-label="`Supprimer ces travaux`"
            @click="store.supprimerTravaux(t.id)"
          >
            <AppIcon nom="croix" />
          </button>
        </li>
      </ul>
      <p
        v-if="b.travaux.some((t) => t.nature === 'construction') && !meuble"
        class="text-warning text-xs"
      >
        Les travaux de construction ou d’agrandissement ne se déduisent pas des revenus fonciers ;
        ils sont ignorés dans le calcul en location nue.
      </p>
    </section>

    <section class="glass space-y-5 rounded-card p-5 sm:p-6">
      <Interrupteur
        v-model="b.emprunt.actif"
        label="Un emprunt finance le bien"
        aide="Les intérêts, l’assurance et les frais de dossier se déduisent au réel."
      />
      <div v-if="b.emprunt.actif" class="grid gap-4 sm:grid-cols-2">
        <ChampNombre v-model="b.emprunt.capital" label="Capital emprunté" />
        <ChampNombre v-model="b.emprunt.tauxAnnuel" label="Taux nominal" suffixe="% / an" />
        <ChampNombre
          v-model="b.emprunt.dureeMois"
          label="Durée"
          suffixe="mois"
          entier
          :min="1"
          :max="600"
        />
        <ChampNombre
          v-model="b.emprunt.tauxAssurance"
          label="Assurance emprunteur"
          suffixe="% du capital / an"
          aide="Taux sur le capital initial. 0,1 à 0,4 % selon l’âge."
        />
        <ChampNombre
          v-model="b.emprunt.anneeDebut"
          label="Année de la première échéance"
          suffixe=""
          entier
          :min="1990"
          :max="2100"
        />
        <ChampNombre
          v-model="b.emprunt.moisDebut"
          label="Mois de la première échéance"
          suffixe=""
          entier
          :min="1"
          :max="12"
        />
        <ChampNombre
          v-model="b.emprunt.fraisDossier"
          label="Frais de dossier et de garantie"
          aide="Déductibles la première année."
        />
      </div>
    </section>

    <section class="glass space-y-5 rounded-card p-5 sm:p-6">
      <h2 class="headline text-xl">Le foyer</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <ChampNombre
          v-model="f.autresRecettesMemeCategorie"
          :label="
            meuble
              ? 'Autres recettes de location meublée du foyer'
              : 'Autres recettes foncières du foyer'
          "
          :aide="
            meuble
              ? 'Les plafonds du micro-BIC s’apprécient sur l’ensemble du foyer.'
              : 'Le micro-foncier s’apprécie sur l’ensemble des loyers nus du foyer, parts de SCI comprises.'
          "
        />
        <ChampNombre
          v-model="store.brouillon.horizonAnnees"
          label="Horizon de la projection"
          suffixe="ans"
          entier
          :min="1"
          :max="30"
        />
      </div>
    </section>
  </div>
</template>
