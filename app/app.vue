<script setup lang="ts">
const { initialiser } = useTheme()
const store = useDossierStore()
onMounted(() => {
  initialiser()
  store.charger()
})
useHead({
  script: [
    {
      // Applique le thème avant le premier rendu pour éviter un éclair blanc.
      innerHTML: `(function(){try{var t=localStorage.getItem('revenus-locatifs:theme');var d=t==='sombre'||((!t||t==='systeme')&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
      tagPosition: 'head',
    },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
