<script setup lang="ts">
import type { CaseDeclaration } from '#shared/tax/cases'
const props = defineProps<{ cases: CaseDeclaration[] }>()
const visibles = computed(() => props.cases.filter((c) => !c.facultative || !c.montant.isZero()))
</script>

<template>
  <table class="tableau">
    <thead>
      <tr>
        <th>Formulaire</th>
        <th>Case</th>
        <th>Libellé</th>
        <th class="num">Montant</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="c in visibles" :key="c.formulaire + c.numero">
        <td class="whitespace-nowrap">{{ c.formulaire }}</td>
        <td class="font-semibold">{{ c.numero }}</td>
        <td>{{ c.libelle }}</td>
        <td class="num font-medium">{{ euros(c.montant) }}</td>
      </tr>
    </tbody>
  </table>
</template>
