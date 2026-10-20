<script setup lang="ts">
import type { LigneAmortissement } from '#shared/tax/amortissements'
defineProps<{ plan: LigneAmortissement[] }>()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="tableau">
      <thead>
        <tr>
          <th>Composant</th>
          <th class="num">Base</th>
          <th class="num">Durée</th>
          <th class="num">Dotation annuelle</th>
          <th class="num">De</th>
          <th class="num">À</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="l in plan" :key="l.cle">
          <td>{{ l.libelle }}</td>
          <td class="num">{{ euros(l.base) }}</td>
          <td class="num">{{ l.dureeAnnees }} ans</td>
          <td class="num font-medium">{{ euros(l.annuite) }}</td>
          <td class="num">{{ l.anneeDebut }}</td>
          <td class="num">{{ l.anneeDebut + l.dureeAnnees - 1 }}</td>
        </tr>
      </tbody>
    </table>
    <p class="text-muted mt-2 text-xs">
      Durées d’usage, en linéaire et en années pleines. La loi n’en fixe pas : votre
      expert-comptable peut en retenir d’autres.
    </p>
  </div>
</template>
