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

// 1. Remover "exports" de todos os pacotes metro* em node_modules e criar symlink/cópia de private -> src
function setupMetroPackages(baseDir) {
  if (!fs.existsSync(baseDir)) return;
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('metro')) {
      const pkgDir = path.join(baseDir, entry.name);
      const pkgPath = path.join(pkgDir, 'package.json');
      
      // Remover exports restritivo
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

      // Criar symlink ou cópia de private -> src para suportar tanto /private/* quanto /src/*
      const srcDir = path.join(pkgDir, 'src');
      const privDir = path.join(pkgDir, 'private');
      if (fs.existsSync(srcDir) && !fs.existsSync(privDir)) {
        try {
          fs.symlinkSync('src', privDir, 'dir');
          console.log(`[patch-metro] Criado symlink private -> src para: ${entry.name}`);
        } catch (e) {
          try {
            fs.cpSync(srcDir, privDir, { recursive: true });
            console.log(`[patch-metro] Copiado src para private em: ${entry.name}`);
          } catch (err2) {
            console.error(`[patch-metro] Falha ao criar private para ${entry.name}:`, err2.message);
          }
        }
      }
    }
  }
}

const rootDir = path.join(__dirname, '..');
const nodeModules = path.join(rootDir, 'node_modules');

// 1. Desbloquear exports e criar mapeamento private do Metro
setupMetroPackages(nodeModules);

// 2. Corrigir instantiateMetro.js (Cannot read properties of undefined reading 'push')
const instantiateMetroPath = path.join(nodeModules, '@expo/cli/build/src/start/server/metro/instantiateMetro.js');
if (fs.existsSync(instantiateMetroPath)) {
  let content = fs.readFileSync(instantiateMetroPath, 'utf8');
  if (content.includes('this._logLines.push') || !content.includes('this._logLines = []')) {
    content = content.replace(
      /class LogRespectingTerminal[\s\S]*?constructor\s*\(\s*stream\s*\)\s*\{[\s\S]*?console\.info\s*=\s*sendLog;\s*\}/m,
      `class LogRespectingTerminal extends _metroCore().Terminal {
    constructor(stream){
        super(stream);
        this._logLines = [];
        const sendLog = (...args)=>{
            if (typeof this.log === 'function') {
                this.log(...args);
            } else {
                process.stdout.write(_nodeUtil().default.format(...args) + '\\n');
            }
        };
        console.log = sendLog;
        console.info = sendLog;
    }`
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

// 6. Corrigir sourceMapString (Cannot read properties of undefined reading 'sourceMapString')
const serializerFiles = [
  path.join(nodeModules, '@expo/metro-config/build/serializer/serializeChunks.js'),
  path.join(nodeModules, '@expo/metro-config/build/serializer/withExpoSerializers.js')
];
for (const file of serializerFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('sourceMapString_1.default')) {
      content = content.replace(
        /const\s*\{\s*sourceMapString\s*\}\s*=\s*sourceMapString_1\.default;/g,
        `const sourceMapString = (sourceMapString_1 && sourceMapString_1.default && sourceMapString_1.default.sourceMapString) || (sourceMapString_1 && sourceMapString_1.sourceMapString) || (sourceMapString_1 && sourceMapString_1.default) || sourceMapString_1;`
      );
      content = content.replace(
        /sourceMapString_1\.default\.sourceMapString/g,
        `((sourceMapString_1 && sourceMapString_1.default && sourceMapString_1.default.sourceMapString) || (sourceMapString_1 && sourceMapString_1.sourceMapString) || (sourceMapString_1 && sourceMapString_1.default) || sourceMapString_1)`
      );
      fs.writeFileSync(file, content, 'utf8');
      console.log(`[patch-metro] Aplicado patch de sourceMapString em: ${path.basename(file)}`);
    }
  }
}

// 7. Corrigir _bundle().default.save em exportEmbedAsync.js e bundle.flow.js
const metroBundleFlow = path.join(nodeModules, 'metro/src/shared/output/bundle.flow.js');
const metroBundleJs = path.join(nodeModules, 'metro/src/shared/output/bundle.js');
for (const bFile of [metroBundleFlow, metroBundleJs]) {
  if (fs.existsSync(bFile)) {
    let bContent = fs.readFileSync(bFile, 'utf8');
    if (!bContent.includes('exports.default = exports;')) {
      bContent += '\nexports.default = exports;\n';
      fs.writeFileSync(bFile, bContent, 'utf8');
      console.log(`[patch-metro] Adicionado exports.default em: ${path.basename(bFile)}`);
    }
  }
}

const exportEmbedPath = path.join(nodeModules, '@expo/cli/build/src/export/embed/exportEmbedAsync.js');
if (fs.existsSync(exportEmbedPath)) {
  let content = fs.readFileSync(exportEmbedPath, 'utf8');
  content = content.replace(
    '_bundle().default.save(',
    '(_bundle().default?.save ? _bundle().default : _bundle()).save('
  );
  fs.writeFileSync(exportEmbedPath, content, 'utf8');
  console.log('[patch-metro] Aplicado patch em exportEmbedAsync.js');
}

console.log('[patch-metro] Todos os patches foram aplicados com sucesso!');
