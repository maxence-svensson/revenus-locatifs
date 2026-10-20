import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    // Prettier tient la mise en forme des balises.
    'vue/html-self-closing': 'off',
  },
})
