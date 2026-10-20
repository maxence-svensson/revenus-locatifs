/** Thème de l'interface : celui du système, ou clair ou sombre imposé par l'utilisateur. */
export type Theme = 'system' | 'light' | 'dark'

const CLE = 'revenus-locatifs:theme'
const META_COLORS = { light: '#f5f5f7', dark: '#000000' }

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'system')

  /** À appeler une fois côté navigateur : relit le choix enregistré. */
  function load() {
    try {
      const saved = localStorage.getItem(CLE)
      theme.value = saved === 'light' || saved === 'dark' ? saved : 'system'
    } catch {
      theme.value = 'system'
    }
  }

  function apply(value: Theme) {
    theme.value = value
    try {
      if (value === 'system') localStorage.removeItem(CLE)
      else localStorage.setItem(CLE, value)
    } catch {
      // Sans stockage, le choix vaut pour la session.
    }
    const root = document.documentElement
    if (value === 'system') delete root.dataset.theme
    else root.dataset.theme = value
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      const scheme = meta.media.includes('dark') ? 'dark' : 'light'
      meta.content = META_COLORS[value === 'system' ? scheme : value]
    }
  }

  return { theme, load, apply }
}
