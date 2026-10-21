<script setup lang="ts">
useSeoMeta({ title: 'Méthode et sources' })
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <PageHeader
      titre="Méthode et sources"
      sous-titre="Ce que l’outil calcule, d’où viennent les règles, et ce qu’il laisse de côté."
    />

    <section class="solid-card space-y-3 rounded-card p-6 sm:p-8">
      <h2 class="headline text-2xl">Location nue : revenus fonciers</h2>
      <p>
        <strong>Micro-foncier.</strong> Si les loyers bruts du foyer ne dépassent pas 15 000 € par
        an, un abattement de 30 % tient lieu de toutes les charges. Aucun déficit n’est possible.
        <span class="text-muted">CGI art. 32.</span>
      </p>
      <p>
        <strong>Réel.</strong> On déduit les charges effectives : frais de gestion et forfait de 20
        € par local, assurances, travaux d’entretien, de réparation et d’amélioration (pas de
        construction ni d’agrandissement), taxe foncière, charges de copropriété non récupérables,
        intérêts, assurance et frais d’emprunt. <span class="text-muted">CGI art. 31.</span>
      </p>
      <p>
        <strong>Déficit foncier.</strong> Les intérêts s’imputent d’abord sur les loyers ; le
        déficit qu’ils laissent ne se reporte que sur les revenus fonciers des dix années suivantes.
        Le déficit dû aux autres charges s’impute sur le revenu global jusqu’à 10 700 € par an (21
        400 € pour des travaux de rénovation énergétique payés entre 2023 et 2025), l’excédent se
        reporte dix ans. Cette imputation oblige à louer jusqu’au 31 décembre de la troisième année
        suivante. <span class="text-muted">CGI art. 156-I-3° ; BOI-RFPI-BASE-30-20.</span>
      </p>
      <p>
        <strong>Option.</strong> Le micro s’applique de plein droit ; l’option pour le réel engage
        trois ans, puis se reconduit chaque année.
      </p>
    </section>

    <section class="solid-card space-y-3 rounded-card p-6 sm:p-8">
      <h2 class="headline text-2xl">Location meublée : BIC non professionnels</h2>
      <p>
        <strong>Micro-BIC.</strong> Jusqu’à 77 700 € de recettes pour une location meublée de longue
        durée, abattement de 50 % avec un minimum de 305 €.
        <span class="text-muted">CGI art. 50-0.</span>
      </p>
      <p>
        <strong>Réel simplifié.</strong> Charges effectives (taxe foncière, assurances, gestion,
        copropriété, comptable, CFE, entretien, emprunt) et amortissement du bien hors terrain, du
        mobilier et des travaux d’amélioration. L’amortissement déduit ne peut pas créer ni
        augmenter un déficit : l’excédent se reporte sans limite de durée. Le déficit dû aux autres
        charges se reporte dix ans sur les seuls BIC non professionnels, jamais sur le salaire.
        <span class="text-muted">CGI art. 39 C et 156-I-1° ter ; BOI-BIC-AMT-20-40-10-10.</span>
      </p>
      <p>
        <strong>Amortissement par composants.</strong> La loi ne fixe pas de durées. L’outil retient
        des usages : gros œuvre 50 ans (55 % du bâti), façade et toiture 25 ans (15 %),
        installations techniques 20 ans (15 %), agencements 15 ans (15 %), mobilier 7 ans, travaux
        d’amélioration 10 ans. Le terrain, 15 % par défaut, ne s’amortit pas. Les frais
        d’acquisition suivent le bien.
      </p>
      <p>
        <strong>Revente.</strong> Pour les cessions depuis le 15 février 2025, les amortissements
        déduits se réintègrent dans le prix d’acquisition pour la plus-value (loi de finances pour
        2025, art. 84). L’outil ne chiffre pas la revente et le rappelle quand il recommande le
        réel.
      </p>
    </section>

    <section class="solid-card space-y-3 rounded-card p-6 sm:p-8">
      <h2 class="headline text-2xl">Ce qui s’ajoute dans les deux cas</h2>
      <p>
        <strong>Impôt sur le revenu.</strong> L’outil calcule l’impôt de votre foyer au barème
        progressif, avec et sans le bien : la différence est l’impôt que le bien vous coûte. Il
        applique le quotient familial, son plafonnement (1 807 € par demi-part, 904 € par quart de
        part) et la décote (897 € pour une personne seule, 1 483 € pour un couple, moins 45,25 % de
        l’impôt brut), et ne recouvre pas un impôt inférieur à 61 €. Un revenu locatif qui fait
        changer de tranche, un déficit qui en fait redescendre, sont ainsi imposés exactement. Votre
        revenu hors ce bien est supposé constant sur la période.
        <span class="text-muted">CGI art. 193, 197 et 1657 ; BOI-IR-LIQ-20-20-30.</span>
      </p>
      <p>
        <strong>Prélèvements sociaux.</strong> Sur le revenu net positif : 17,2 % pour les revenus
        fonciers de la location nue, 18,6 % pour la location meublée non professionnelle, dont la
        CSG passe de 9,2 % à 10,6 % à compter des revenus 2025. 6,8 points de CSG restent
        déductibles du revenu global de l’année suivante : l’outil compte cette économie l’année
        d’après, au barème.
        <span class="text-muted"
          >LFSS 2026, art. 12 ; CSS art. L136-6 et L136-8 ; CGI art. 154 quinquies.</span
        >
      </p>
      <p>
        <strong>Arrondis.</strong> Les bases sont arrondies à l’euro, comme sur les formulaires.
        Tous les calculs se font en décimal exact.
      </p>
    </section>

    <section class="solid-card space-y-3 rounded-card p-6 sm:p-8">
      <h2 class="headline text-2xl">Nue ou meublée : la comparaison</h2>
      <p>
        Le résultat met les quatre régimes côte à côte sur le même bien, le même foyer, les mêmes
        charges, le même emprunt et les mêmes travaux. Le loyer saisi est celui du type choisi ;
        celui de l’autre type s’en déduit par le supplément de loyer en meublé que vous indiquez (0
        % par défaut : même loyer). Le mobilier, l’expert-comptable et la CFE ne comptent qu’en
        meublé ; les travaux d’amélioration se déduisent en nu et s’amortissent en meublé.
      </p>
      <p>
        La comparaison est fiscale. Elle ne chiffre ni l’ameublement, ni la rotation plus forte des
        locataires en meublé, ni la plus-value à la revente, où les amortissements déduits se
        réintègrent. Changer de type de location suppose aussi un nouveau bail et, en meublé, une
        déclaration d’activité.
      </p>
    </section>

    <section class="solid-card space-y-3 rounded-card p-6 sm:p-8">
      <h2 class="headline text-2xl">Limites connues</h2>
      <ul class="list-inside list-disc space-y-1">
        <li>
          Un seul bien par dossier ; les plafonds du micro tiennent compte des autres recettes que
          vous indiquez, mais pas de leurs charges.
        </li>
        <li>
          Pas de prorata la première année : chaque année projetée est une année pleine de location.
        </li>
        <li>
          Pas de meublé de tourisme, de chambre d’hôtes, de résidence services, ni de loueur
          professionnel.
        </li>
        <li>
          Pas de société à l’IS, ni de SCI à l’IR en tant que telle (un associé peut saisir sa
          quote-part).
        </li>
        <li>
          Pas de dispositif fiscal particulier (Pinel, Denormandie, Malraux, Loc’Avantages,
          monuments historiques).
        </li>
        <li>Pas de plus-value à la revente, pas d’IFI.</li>
        <li>
          Pas de demi-part de parent isolé (case T) ni de veuf avec enfants, dont les plafonds sont
          particuliers ; pas de réductions ni de crédits d’impôt, ni de contribution sur les hauts
          revenus.
        </li>
        <li>
          Un déficit imputé qui dépasse le revenu du foyer ne forme pas de déficit global
          reportable.
        </li>
        <li>
          Les règles connues s’arrêtent aux revenus 2025 ; les années suivantes les appliquent
          telles quelles.
        </li>
      </ul>
    </section>

    <section class="solid-card space-y-2 rounded-card p-6 sm:p-8">
      <h2 class="headline text-2xl">Sources</h2>
      <ul class="space-y-1">
        <li>
          <a
            class="text-link underline-offset-2 hover:underline"
            href="https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006069577/"
            >Code général des impôts</a
          >, articles 28 à 32, 39 C, 50-0, 154 quinquies, 156.
        </li>
        <li>
          <a
            class="text-link underline-offset-2 hover:underline"
            href="https://bofip.impots.gouv.fr/bofip/4789-PGP.html"
            >BOI-RFPI-BASE-30-20</a
          >, imputation des déficits fonciers.
        </li>
        <li>
          <a
            class="text-link underline-offset-2 hover:underline"
            href="https://bofip.impots.gouv.fr/bofip/4826-PGP.html"
            >BOI-BIC-AMT-20-40-10-10</a
          >, amortissements des loueurs en meublé non professionnels.
        </li>
        <li>
          <a
            class="text-link underline-offset-2 hover:underline"
            href="https://www.impots.gouv.fr/particulier/questions/je-mets-en-location-un-logement-vide-quelles-sont-mes-obligations"
            >impots.gouv.fr</a
          >, brochure pratique des revenus fonciers et des locations meublées.
        </li>
        <li>
          Le code source et les tests sont publics :
          <a
            class="text-link underline-offset-2 hover:underline"
            href="https://github.com/maxence-svensson/revenus-locatifs"
            >github.com/maxence-svensson/revenus-locatifs</a
          >.
        </li>
      </ul>
    </section>
  </div>
</template>
