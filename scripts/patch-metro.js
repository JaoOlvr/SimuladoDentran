const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, search, replacement) {
  if (!fs.existsSync(filePath)) return;
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(search)) {
      content = content.replace(search, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-metro] Aplicado patch em: ${path.basename(filePath)}`);
    }
  } catch (err) {
    console.error(`[patch-metro] Erro ao aplicar patch em ${filePath}:`, err.message);
  }
}

// 1. Remover "exports" de todos os pacotes metro* em node_modules
function removeExports(baseDir) {
  if (!fs.existsSync(baseDir)) return;
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('metro')) {
      const pkgPath = path.join(baseDir, entry.name, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (pkg.exports) {
            delete pkg.exports;
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
            console.log(`[patch-metro] Removido "exports" de: ${entry.name}`);
          }
        } catch (e) {
          console.error(`[patch-metro] Falha ao processar ${pkgPath}:`, e.message);
        }
      }
    }
  }
}

const rootDir = path.join(__dirname, '..');
const nodeModules = path.join(rootDir, 'node_modules');

// 1. Desbloquear exports do Metro
removeExports(nodeModules);

// 2. Corrigir instantiateMetro.js (Cannot read properties of undefined reading 'push')
const instantiateMetroPath = path.join(nodeModules, '@expo/cli/build/src/start/server/metro/instantiateMetro.js');
if (fs.existsSync(instantiateMetroPath)) {
  let content = fs.readFileSync(instantiateMetroPath, 'utf8');
  if (content.includes('this._logLines.push') || !content.includes('this._logLines = []')) {
    content = content.replace(
      /constructor\s*\(\s*stream\s*\)\s*\{[\s\S]*?console\.info\s*=\s*sendLog;\s*\}/m,
      `constructor(stream){\n        super(stream);\n        this._logLines = [];\n        const sendLog = (...args)=>{\n            if (typeof this.log === 'function') {\n                this.log(...args);\n            } else {\n                process.stdout.write(_nodeUtil().default.format(...args) + '\\n');\n            }\n        };\n        console.log = sendLog;\n        console.info = sendLog;\n    }`
    );
    fs.writeFileSync(instantiateMetroPath, content, 'utf8');
    console.log('[patch-metro] Aplicado patch em instantiateMetro.js via regex');
  }
}

// 3. Corrigir metro-transform-worker.js (metro_cache_key e JsFileWrapping)
const transformWorkerPath = path.join(nodeModules, '@expo/metro-config/build/transform-worker/metro-transform-worker.js');
if (fs.existsSync(transformWorkerPath)) {
  let content = fs.readFileSync(transformWorkerPath, 'utf8');
  content = content.replace(
    `const filesKey = (0, metro_cache_key_1.default)([`,
    `const getCacheKeyFn = typeof metro_cache_key_1.default === 'function' ? metro_cache_key_1.default : (metro_cache_key_1.default?.getCacheKey || metro_cache_key_1.getCacheKey);\n    const filesKey = (0, getCacheKeyFn)([`
  );
  content = content.replaceAll(
    `JsFileWrapping_1.default.`,
    `(JsFileWrapping_1.default || JsFileWrapping_1).`
  );
  fs.writeFileSync(transformWorkerPath, content, 'utf8');
  console.log('[patch-metro] Aplicado patch em metro-transform-worker.js');
}

// 4. Corrigir reconcileTransformSerializerPlugin.js (JsFileWrapping)
const reconcilePluginPath = path.join(nodeModules, '@expo/metro-config/build/serializer/reconcileTransformSerializerPlugin.js');
if (fs.existsSync(reconcilePluginPath)) {
  let content = fs.readFileSync(reconcilePluginPath, 'utf8');
  content = content.replaceAll(
    `JsFileWrapping_1.default.`,
    `(JsFileWrapping_1.default || JsFileWrapping_1).`
  );
  fs.writeFileSync(reconcilePluginPath, content, 'utf8');
  console.log('[patch-metro] Aplicado patch em reconcileTransformSerializerPlugin.js');
}

// 5. Corrigir watchers de TypeScript (eventsQueue is not iterable)
const watchTsFiles = [
  path.join(nodeModules, '@expo/cli/build/src/start/server/metro/waitForMetroToObserveTypeScriptFile.js'),
  path.join(nodeModules, '@expo/cli/build/src/start/server/metro/metroWatchTypeScriptFiles.js')
];
for (const file of watchTsFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replaceAll(
      `const listener = ({ eventsQueue  })=>{`,
      `const listener = (eventData)=>{\n        const eventsQueue = Array.isArray(eventData) ? eventData : (eventData?.eventsQueue || []);`
    );
    content = content.replaceAll(
      `const listener = ({ eventsQueue })=>{`,
      `const listener = (eventData)=>{\n        const eventsQueue = Array.isArray(eventData) ? eventData : (eventData?.eventsQueue || []);`
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log(`[patch-metro] Aplicado patch de watcher em: ${path.basename(file)}`);
  }
}

console.log('[patch-metro] Todos os patches foram aplicados com sucesso!');
