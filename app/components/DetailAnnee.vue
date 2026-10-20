<script setup lang="ts">
import type { LigneProjection } from '#shared/projection/projection'
import type { Decimal } from '#shared/tax/decimal'

const props = defineProps<{ ligne: LigneProjection }>()

interface Ligne {
  libelle: string
  montant: Decimal
  /** Une ligne qui diminue l'impôt. */
  moins?: boolean
  total?: boolean
  doux?: boolean
}

const micro = computed<Ligne[]>(() => {
  const r = props.ligne.micro.resultat
  const lignes: Ligne[] = [{ libelle: 'Recettes brutes', montant: r.recettes }]
  lignes.push({ libelle: `Abattement forfaitaire`, montant: r.abattement, moins: true })
  if ('deficitsAnterieursImputes' in r && r.deficitsAnterieursImputes.greaterThan(0))
    lignes.push({
      libelle: 'Déficits antérieurs imputés',
      montant: r.deficitsAnterieursImputes,
      moins: true,
    })
  lignes.push({ libelle: 'Base imposable', montant: r.baseImposable, total: true })
  lignes.push({
    libelle: `Impôt sur le revenu (${props.ligne.brut.annee})`,
    montant: r.impotRevenu,
  })
  lignes.push({ libelle: 'Prélèvements sociaux 17,2 %', montant: r.prelevementsSociaux })
  if (props.ligne.micro.economieCsgDeductible.greaterThan(0))
    lignes.push({
      libelle: 'CSG déductible de l’année précédente',
      montant: props.ligne.micro.economieCsgDeductible,
      moins: true,
    })
  lignes.push({ libelle: 'À payer', montant: props.ligne.micro.net, total: true })
  return lignes
})

const reel = computed<Ligne[]>(() => {
  const r = props.ligne.reel.resultat
  const lignes: Ligne[] = [{ libelle: 'Recettes brutes', montant: r.recettes }]
  if (r.regime === 'reel-foncier') {
    const c = r.charges
    if (c.fraisAdministration.greaterThan(0))
      lignes.push({
        libelle: 'Frais de gestion',
        montant: c.fraisAdministration,
        moins: true,
        doux: true,
      })
    lignes.push({
      libelle: 'Forfait de gestion',
      montant: c.forfaitGestion,
      moins: true,
      doux: true,
    })
    if (c.assurances.greaterThan(0))
      lignes.push({ libelle: 'Assurances', montant: c.assurances, moins: true, doux: true })
    if (c.travaux.greaterThan(0))
      lignes.push({ libelle: 'Travaux déductibles', montant: c.travaux, moins: true, doux: true })
    if (c.taxeFonciere.greaterThan(0))
      lignes.push({ libelle: 'Taxe foncière', montant: c.taxeFonciere, moins: true, doux: true })
    if (c.chargesCopropriete.greaterThan(0))
      lignes.push({
        libelle: 'Charges de copropriété',
        montant: c.chargesCopropriete,
        moins: true,
        doux: true,
      })
    if (c.interets.greaterThan(0))
      lignes.push({
        libelle: 'Intérêts et frais d’emprunt',
        montant: c.interets,
        moins: true,
        doux: true,
      })
    lignes.push({
      libelle: r.resultatBrut.isNegative() ? 'Déficit foncier' : 'Revenu foncier net',
      montant: r.resultatBrut,
      total: true,
    })
    if (r.deficitImputeRevenuGlobal.greaterThan(0))
      lignes.push({
        libelle: `Imputé sur le revenu global (plafond ${euros(r.plafondImputationGlobal)})`,
        montant: r.deficitImputeRevenuGlobal,
        doux: true,
      })
    if (r.deficitReportable.greaterThan(0))
      lignes.push({
        libelle: 'Reporté sur les revenus fonciers (10 ans)',
        montant: r.deficitReportable,
        doux: true,
      })
    if (r.deficitsAnterieursImputes.greaterThan(0))
      lignes.push({
        libelle: 'Déficits antérieurs imputés',
        montant: r.deficitsAnterieursImputes,
        moins: true,
      })
    lignes.push({ libelle: 'Base imposable', montant: r.baseImposable, total: true })
    lignes.push({ libelle: 'Impôt sur le revenu', montant: r.impotRevenu })
    lignes.push({ libelle: 'Prélèvements sociaux 17,2 %', montant: r.prelevementsSociaux })
    if (r.economieDeficitGlobal.greaterThan(0))
      lignes.push({
        libelle: 'Économie d’impôt du déficit imputé',
        montant: r.economieDeficitGlobal,
        moins: true,
      })
  } else {
    const c = r.charges
    const charges: [string, Decimal][] = [
      ['Taxe foncière', c.taxeFonciere],
      ['Assurances', c.assurances],
      ['Frais de gestion', c.fraisGestion],
      ['Charges de copropriété', c.chargesCopropriete],
      ['Expert-comptable', c.fraisComptable],
      ['CFE', c.cfe],
      ['Entretien et réparations', c.entretien],
      ['Intérêts et frais d’emprunt', c.interets],
    ]
    for (const [l, m] of charges)
      if (m.greaterThan(0)) lignes.push({ libelle: l, montant: m, moins: true, doux: true })
    lignes.push({
      libelle: 'Résultat avant amortissement',
      montant: r.resultatAvantAmortissement,
      total: true,
    })
    lignes.push({
      libelle: 'Dotation aux amortissements de l’année',
      montant: r.dotationAmortissement,
      doux: true,
    })
    if (r.amortissementsAnterieursDisponibles.greaterThan(0))
      lignes.push({
        libelle: 'Amortissements en report disponibles',
        montant: r.amortissementsAnterieursDisponibles,
        doux: true,
      })
    lignes.push({
      libelle: 'Amortissement déduit (plafonné au résultat)',
      montant: r.amortissementDeduit,
      moins: true,
    })
    if (r.amortissementReporte.greaterThan(0))
      lignes.push({
        libelle: 'Amortissement reporté, sans limite de durée',
        montant: r.amortissementReporte,
        doux: true,
      })
    if (r.deficitExercice.greaterThan(0))
      lignes.push({
        libelle: 'Déficit reporté sur les BIC non professionnels (10 ans)',
        montant: r.deficitExercice,
        doux: true,
      })
    if (r.deficitsAnterieursImputes.greaterThan(0))
      lignes.push({
        libelle: 'Déficits antérieurs imputés',
        montant: r.deficitsAnterieursImputes,
        moins: true,
      })
    lignes.push({ libelle: 'Base imposable', montant: r.baseImposable, total: true })
    lignes.push({ libelle: 'Impôt sur le revenu', montant: r.impotRevenu })
    lignes.push({ libelle: 'Prélèvements sociaux 17,2 %', montant: r.prelevementsSociaux })
  }
  if (props.ligne.reel.economieCsgDeductible.greaterThan(0))
    lignes.push({
      libelle: 'CSG déductible de l’année précédente',
      montant: props.ligne.reel.economieCsgDeductible,
      moins: true,
    })
  lignes.push({ libelle: 'À payer', montant: props.ligne.reel.net, total: true })
  return lignes
})

const nomMicro = computed(() =>
  props.ligne.micro.resultat.regime === 'micro-foncier' ? 'Micro-foncier' : 'Micro-BIC',
)
const nomReel = computed(() =>
  props.ligne.reel.resultat.regime === 'reel-foncier' ? 'Réel foncier' : 'LMNP au réel',
)
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <section class="carte">
      <h3 class="text-micro mb-3 text-sm font-semibold uppercase">{{ nomMicro }}</h3>
      <p v-if="!ligne.micro.resultat.applicable" class="text-attention mb-3 text-sm">
        {{ ligne.micro.resultat.motifInapplicable }}
      </p>
      <dl>
        <div
          v-for="(l, i) in micro"
          :key="i"
          class="flex justify-between gap-3 py-1 text-sm"
          :class="{
            'border-bordure mt-1 border-t pt-2 font-semibold': l.total,
            'text-texte-doux': l.doux,
          }"
        >
          <dt>{{ l.libelle }}</dt>
          <dd class="num">
            {{ l.moins && !l.montant.isZero() ? '− ' : '' }}{{ euros(l.montant) }}
          </dd>
        </div>
      </dl>
    </section>
    <section class="carte">
      <h3 class="text-reel mb-3 text-sm font-semibold uppercase">{{ nomReel }}</h3>
      <dl>
        <div
          v-for="(l, i) in reel"
          :key="i"
          class="flex justify-between gap-3 py-1 text-sm"
          :class="{
            'border-bordure mt-1 border-t pt-2 font-semibold': l.total,
            'text-texte-doux': l.doux,
          }"
        >
          <dt>{{ l.libelle }}</dt>
          <dd class="num">
            {{ l.moins && !l.montant.isZero() ? '− ' : '' }}{{ euros(l.montant) }}
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>
