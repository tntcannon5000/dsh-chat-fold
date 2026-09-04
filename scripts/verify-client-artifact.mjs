import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const sourceMap = JSON.parse(readFileSync(new URL('../lib/client.js.map', import.meta.url), 'utf8'))
const gitignore = readFileSync(new URL('../.gitignore', import.meta.url), 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function execute(script) {
  const registrations = []
  const window = {
    __ModuleLoader__: {
      load(registration) {
        registrations.push(registration)
      },
    },
  }
  runInNewContext(script, { window })
  return registrations
}

assert(
  source.startsWith(`/* ${packageJson.name} v${packageJson.version} */\n`),
  'client artifact does not identify its package version',
)

const registrations = execute(source)
assert(registrations.length === 1, 'client artifact must register exactly one factory')
assert(registrations[0]?.id === packageJson.name, 'client artifact registered the wrong module id')
const exported = registrations[0].factory(() => {
  throw new Error('client artifact unexpectedly required an external module')
})
assert(
  JSON.stringify(Object.keys(exported).sort()) === JSON.stringify(['apply', 'inject', 'name']),
  'client artifact exports do not match the Cordis plugin face',
)

const neighbor = id => `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: () => ({}) });\n`
const combo = execute(`${neighbor('before')}\n${source};\n${neighbor('after')}`)
assert(
  JSON.stringify(combo.map(registration => registration.id))
    === JSON.stringify(['before', packageJson.name, 'after']),
  'client artifact does not compose safely inside a startup combo',
)

assert(sourceMap.version === 3, 'client source map is not Source Map v3')
assert(Array.isArray(sourceMap.sources), 'client source map has no sources array')
assert(packageJson.files.includes('lib/client.js'), 'published files omit lib/client.js')
assert(packageJson.files.includes('lib/client.js.map'), 'published files omit lib/client.js.map')
assert(packageJson.files.includes('lib/index.js.map'), 'published files omit lib/index.js.map')
assert(packageJson.files.includes('lib/types'), 'published files omit client declarations')
assert(
  !gitignore.split(/\r?\n/u).some(line => /^\/?lib\/?$/u.test(line.trim())),
  'lib is ignored, so GitHub tag installs cannot contain the built plugin',
)

console.log(`verified ${packageJson.name} v${packageJson.version} client artifact and publication payload`)
