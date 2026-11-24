const fs = require('fs');
const path = require('path');

function patchPackageJson(pkgPath) {
  if (!fs.existsSync(pkgPath)) return;
  try {
    const content = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(content);
    if (pkg.exports) {
      delete pkg.exports;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
      console.log(`[patch-metro] Removido "exports" com sucesso de: ${pkgPath}`);
    }
  } catch (err) {
    console.error(`[patch-metro] Erro ao patchear ${pkgPath}:`, err.message);
  }
}

function walkAndPatch(baseDir) {
  if (!fs.existsSync(baseDir)) return;
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('metro')) {
      const pkgPath = path.join(baseDir, entry.name, 'package.json');
      patchPackageJson(pkgPath);
    }
  }
}

// Aplicar em node_modules locais
const nodeModulesDir = path.join(__dirname, '..', 'node_modules');
walkAndPatch(nodeModulesDir);

console.log('[patch-metro] Patch do Metro finalizado com sucesso.');
