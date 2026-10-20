<template>
  <div class="flex min-h-dvh flex-col">
    <AppTopBar />
    <DemoBanner />
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-10 sm:px-6">
      <slot />
    </main>
    <AppFooter />
    <AppTabBar />
  </div>
</template>
