<template>
  <footer class="border-t border-separator">
    <div
      class="mx-auto max-w-[72rem] space-y-4 px-5 pt-12 pb-36 text-sm text-muted sm:px-8 lg:pb-12"
    >
      <p class="max-w-prose">
        Revenus locatifs est un outil indépendant, sans lien avec l’administration fiscale. Ses
        résultats sont indicatifs et ne remplacent pas un conseil fiscal : vérifiez-les avant de
        déclarer. Vos données restent dans ce navigateur.
      </p>
      <p class="flex flex-wrap gap-x-6 gap-y-2">
        <NuxtLink to="/methode" class="hover:text-label hover:underline"
          >Méthode et sources</NuxtLink
        >
        <a
          href="https://github.com/maxence-svensson/revenus-locatifs"
          class="hover:text-label hover:underline"
          >Code source</a
        >
        <a href="https://crypto-plusvalue.vercel.app" class="hover:text-label hover:underline"
          >Du même auteur : Crypto-plusvalue</a
        >
      </p>
    </div>
  </footer>
</template>
