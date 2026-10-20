<script setup lang="ts">
const { load } = useTheme()
const store = useDossierStore()
onMounted(() => {
  load()
  store.charger()
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
