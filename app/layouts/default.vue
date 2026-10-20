<template>
  <div class="relative min-h-screen overflow-x-clip">
    <div class="backdrop-glow pointer-events-none fixed inset-0 -z-10" aria-hidden="true"></div>

    <a
      href="#contenu"
      class="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      Aller au contenu
    </a>

    <AppTopBar />

    <main id="contenu" class="mx-auto max-w-[72rem] px-5 pt-6 pb-36 sm:px-8 lg:pt-10 lg:pb-16">
      <DemoBanner />
      <slot />
    </main>
    <AppFooter />

    <AppTabBar />
  </div>
</template>
