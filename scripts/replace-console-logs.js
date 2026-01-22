/**
 * Script pour remplacer les console.log par le logger
 * Usage: node scripts/replace-console-logs.js
 *
 * ⚠️ ATTENTION : Faire un commit AVANT d'exécuter ce script
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Fichiers à ignorer
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'scripts',
  'logger.ts', // Ne pas modifier le logger lui-même
];

// Compteurs
let filesModified = 0;
let logsReplaced = 0;

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function processFile(filePath) {
  if (shouldIgnore(filePath)) return;
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Compter les console.log
  const logCount = (content.match(/console\.log\(/g) || []).length;
  if (logCount === 0) return;

  // Remplacer console.log par logger.debug
  content = content.replace(/console\.log\(/g, 'logger.debug(');

  // Remplacer console.info par logger.info
  content = content.replace(/console\.info\(/g, 'logger.info(');

  // Remplacer console.warn par logger.warn
  content = content.replace(/console\.warn\(/g, 'logger.warn(');

  // console.error reste console.error ou devient logger.error
  // On garde console.error pour les vraies erreurs

  // Ajouter l'import si nécessaire
  if (content !== originalContent && !content.includes("from '@/lib/logger'") && !content.includes("from '../lib/logger'")) {
    // Trouver la première ligne d'import
    const importMatch = content.match(/^import .+ from .+;?\n/m);
    if (importMatch) {
      const importStatement = `import { logger } from '@/lib/logger';\n`;
      content = content.replace(importMatch[0], importMatch[0] + importStatement);
    } else {
      // Pas d'import existant, ajouter en haut après 'use client' si présent
      const useClientMatch = content.match(/^'use client';\n/);
      if (useClientMatch) {
        content = content.replace(useClientMatch[0], useClientMatch[0] + `\nimport { logger } from '@/lib/logger';\n`);
      } else {
        // Ajouter en tout début
        content = `import { logger } from '@/lib/logger';\n\n` + content;
      }
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    filesModified++;
    logsReplaced += logCount;
    console.log(`✅ ${path.relative(SRC_DIR, filePath)} - ${logCount} logs remplacés`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldIgnore(filePath)) {
        walkDir(filePath);
      }
    } else {
      processFile(filePath);
    }
  }
}

console.log('🔍 Recherche des console.log dans src/...\n');
walkDir(SRC_DIR);

console.log(`\n📊 Résultat:`);
console.log(`   Fichiers modifiés: ${filesModified}`);
console.log(`   Logs remplacés: ${logsReplaced}`);
console.log(`\n✅ Terminé ! Vérifie les modifications avec: git diff`);