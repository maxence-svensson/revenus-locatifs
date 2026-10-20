export type Theme = 'systeme' | 'clair' | 'sombre'

const CLE = 'revenus-locatifs:theme'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'systeme')

  function appliquer() {
    if (typeof document === 'undefined') return
    const sombre =
      theme.value === 'sombre' ||
      (theme.value === 'systeme' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', sombre)
  }

  function choisir(t: Theme) {
    theme.value = t
    try {
      localStorage.setItem(CLE, t)
    } catch {
      // Sans stockage, le choix vaut pour la session.
    }
    appliquer()
  }

  function initialiser() {
    try {
      const sauve = localStorage.getItem(CLE) as Theme | null
      if (sauve === 'clair' || sauve === 'sombre' || sauve === 'systeme') theme.value = sauve
    } catch {
      // Rien.
    }
    appliquer()
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', appliquer)
  }

  return { theme, choisir, initialiser }
}
