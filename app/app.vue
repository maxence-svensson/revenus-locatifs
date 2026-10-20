<script setup lang="ts">
const { load } = useTheme()
const store = useDossierStore()
const route = useRoute()
onMounted(() => {
  load()
  store.charger()
  // `?exemple` ouvre n'importe quelle page en mode démonstration, comme sur Crypto-plusvalue.
  if ('exemple' in route.query && !store.demo) store.chargerExemple()
})
useHead({
  titleTemplate: (title) =>
    title && !title.startsWith('Revenus locatifs')
      ? `${title} | Revenus locatifs`
      : (title ?? null),
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
