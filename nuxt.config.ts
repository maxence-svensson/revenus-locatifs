import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/eslint', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  typescript: { strict: true },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      title: 'Revenus locatifs : micro ou réel, la réponse chiffrée',
      // Thème choisi par l'utilisateur, appliqué avant l'affichage : pas d'éclair de l'autre thème.
      script: [
        {
          innerHTML:
            "try{var t=localStorage.getItem('revenus-locatifs:theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
        },
      ],
      meta: [
        {
          name: 'description',
          content:
            'Comparez micro-foncier, réel, micro-BIC et LMNP au réel pour votre bien en location. Calcul dans votre navigateur, règles sourcées, cases à reporter.',
        },
        { name: 'theme-color', content: '#f5f5f7', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#000000', media: '(prefers-color-scheme: dark)' },
      ],
    },
  },
})
