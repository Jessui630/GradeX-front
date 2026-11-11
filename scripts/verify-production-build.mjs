import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? 'dist')
const errors = []

function check(condition, message) {
  if (!condition) errors.push(message)
}

async function readIfExists(file) {
  try {
    const info = await stat(file)
    if (!info.isFile() || info.size === 0) return null
    return await readFile(file, 'utf8')
  } catch {
    return null
  }
}

const html = await readIfExists(path.join(root, 'index.html'))
check(Boolean(html), `Falta ${path.join(root, 'index.html')}.`)

if (html) {
  const assetRefs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(
    (match) => match[1],
  )
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1])
  const styles = assetRefs.filter((ref) => ref.endsWith('.css'))
  const bundledScripts = scripts.filter((ref) => ref.startsWith('/assets/'))

  check(html.includes('<div id="root"></div>'), 'index.html no contiene el punto de montaje de React.')
  check(bundledScripts.length > 0, 'index.html no referencia un bundle JavaScript de /assets/.')
  check(styles.length > 0, 'index.html no referencia un CSS compilado de /assets/.')
  check(
    !html.includes('Sprint 1 - Despliegue automático funcionando'),
    'index.html contiene el texto de la pantalla placeholder.',
  )

  for (const ref of assetRefs) {
    const file = path.join(root, ref.replace(/^\/+/, ''))
    const content = await readIfExists(file)
    check(Boolean(content), `El asset referenciado no existe o está vacío: ${ref}`)
  }
}

const assetsDir = path.join(root, 'assets')
let assetFiles = []
try {
  assetFiles = await readdir(assetsDir)
} catch {
  check(false, `No existe el directorio de assets compilados: ${assetsDir}`)
}

const jsFiles = assetFiles.filter((file) => file.endsWith('.js'))
const cssFiles = assetFiles.filter((file) => file.endsWith('.css'))
check(jsFiles.length > 0, 'No se generó ningún bundle JavaScript en dist/assets.')
check(cssFiles.length > 0, 'No se generó ningún CSS en dist/assets.')

const bundles = []
for (const file of jsFiles) {
  const content = await readIfExists(path.join(assetsDir, file))
  check(Boolean(content), `El bundle JavaScript está vacío: ${file}`)
  if (content) bundles.push(content)
}
const javascript = bundles.join('\n')

const forbidden = [
  'Sprint 1 - Despliegue automático funcionando',
  'Progressive Web Application',
]
for (const text of forbidden) {
  check(!javascript.includes(text), `El bundle contiene la pantalla placeholder: "${text}".`)
}

const requiredScreens = [
  'Decide con criterio',
  'Inicia sesión',
  'Crear cuenta',
  'Mis solicitudes',
  'Nueva evaluación',
  'Perfil',
]
for (const text of requiredScreens) {
  check(javascript.includes(text), `El bundle no contiene la pantalla real esperada: "${text}".`)
}

const serviceWorker = await readIfExists(path.join(root, 'sw.js'))
check(Boolean(serviceWorker), 'No se generó dist/sw.js para la PWA.')

const manifestContent = await readIfExists(path.join(root, 'manifest.webmanifest'))
check(Boolean(manifestContent), 'No se generó dist/manifest.webmanifest.')
if (manifestContent) {
  try {
    const manifest = JSON.parse(manifestContent)
    check(manifest.name === 'GradeX', 'El manifest PWA no corresponde a GradeX.')
  } catch {
    errors.push('El manifest PWA no contiene JSON válido.')
  }
}

if (errors.length > 0) {
  console.error('Verificación del build de producción falló:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(
  `Build de producción verificado: ${jsFiles.length} JS, ${cssFiles.length} CSS, React real y PWA presentes.`,
)
