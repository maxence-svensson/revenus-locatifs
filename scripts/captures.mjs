/**
 * Captures d'écran du README, prises dans un navigateur Chromium sans interface (Chrome, Edge,
 * Brave, Chromium) piloté par le protocole DevTools, sans dépendance à installer.
 *
 *   npm run build && PORT=3002 node .output/server/index.mjs
 *   node scripts/captures.mjs
 *
 * Variables : CHROME_PATH (navigateur, sinon le premier trouvé), BASE_URL (http://localhost:3002).
 */
import { spawn } from 'node:child_process'
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CANDIDATS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]
async function premierNavigateur() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  for (const c of CANDIDATS) {
    try {
      await access(c)
      return c
    } catch {
      // Suivant.
    }
  }
  throw new Error('Aucun navigateur Chromium trouvé : indiquez CHROME_PATH.')
}

const BROWSER = await premierNavigateur()
const BASE = process.env.BASE_URL ?? 'http://localhost:3002'
const OUT = new URL('../docs/captures/', import.meta.url)
const DEBUG_PORT = 9334

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const profile = await mkdtemp(join(tmpdir(), 'captures-'))
const browser = spawn(
  BROWSER,
  [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

let socketUrl
for (let attempt = 0; attempt < 50 && !socketUrl; attempt++) {
  await sleep(200)
  try {
    const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json()
    socketUrl = pages.find((page) => page.type === 'page')?.webSocketDebuggerUrl
  } catch {
    // Le navigateur démarre encore.
  }
}
if (!socketUrl) throw new Error('Navigateur injoignable : vérifiez CHROME_PATH.')

const socket = new WebSocket(socketUrl)
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }))
let lastId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  const callback = pending.get(message.id)
  if (!callback) return
  pending.delete(message.id)
  callback(message)
})
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++lastId
    pending.set(id, (message) =>
      message.error ? reject(new Error(message.error.message)) : resolve(message.result),
    )
    socket.send(JSON.stringify({ id, method, params }))
  })

const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result
    .value

async function open(path, { width, height, scale, wait, theme = 'light' }) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: width < 600,
  })
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: theme }],
  })
  await send('Page.navigate', { url: BASE + path })
  // Laisse charger l'exemple et finir les animations d'entrée et de la balance.
  await sleep(wait)
}

/** Rectangle d'un élément dans la page, avec une marge autour. */
async function areaOf(selector, margin = 24) {
  return evaluate(`(() => {
    const box = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect()
    return { x: box.x + scrollX - ${margin}, y: box.y + scrollY - ${margin},
             width: box.width + ${2 * margin}, height: box.height + ${2 * margin}, scale: 1 }
  })()`)
}

async function capture(name, clip) {
  const { data } = await send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 88,
    captureBeyondViewport: Boolean(clip),
    ...(clip ? { clip } : {}),
  })
  await writeFile(new URL(`${name}.jpg`, OUT), Buffer.from(data, 'base64'))
  console.log(`docs/captures/${name}.jpg`)
}

await mkdir(OUT, { recursive: true })
await send('Page.enable')

await open('/', { width: 1440, height: 900, scale: 2, wait: 3000 })
await capture('accueil')

await open('/resultat?exemple', { width: 1440, height: 900, scale: 2, wait: 3500 })
await capture('resultat')

// Fenêtre haute : les halos du fond sont fixes, une capture au-delà de la fenêtre laisserait
// une coupure.
await open('/resultat?exemple', { width: 1440, height: 2600, scale: 2, wait: 3500 })
await capture('detail-annee', await areaOf('#detail-annee', 0))
await capture('cases', await areaOf('#cases', 0))

await open('/simulateur?exemple', { width: 1440, height: 1200, scale: 2, wait: 3000 })
await capture('simulateur')

// Le même bien en meublé : plan d'amortissement.
await open('/simulateur?exemple', { width: 1440, height: 2600, scale: 2, wait: 3000 })
await evaluate(`document.querySelector('input[type="radio"][value="meublee"]').click()`)
await sleep(600)
await send('Page.navigate', { url: BASE + '/resultat' })
await sleep(3500)
await capture('amortissements', await areaOf('#amortissements', 0))

await open('/resultat?exemple', { width: 390, height: 844, scale: 3, wait: 3500 })
await capture('mobile')

await open('/resultat?exemple', { width: 1440, height: 900, scale: 2, wait: 3500, theme: 'dark' })
await capture('sombre')

socket.close()
const exited = new Promise((resolve) => browser.once('exit', resolve))
browser.kill()
await exited
await rm(profile, { recursive: true, force: true, maxRetries: 5 })
