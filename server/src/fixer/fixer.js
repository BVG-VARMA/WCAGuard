import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import { generateUnifiedDiff } from './diff.js';
import { restoreBackup } from './rollback.js';
import { runScan } from '../scanner/scanner.js';
import { logger } from '../utils/logger.js';

import * as imageAlt from './rules/image-alt.js';
import * as linkName from './rules/link-name.js';
import * as buttonName from './rules/button-name.js';
import * as label from './rules/label.js';
import * as htmlLang from './rules/html-lang.js';
import * as colorContrast from './rules/color-contrast.js';
import * as ariaValidAttr from './rules/aria-valid-attr.js';
import * as documentTitle from './rules/document-title.js';
import * as headingOrder from './rules/heading-order.js';
import * as landmark from './rules/landmark.js';
import * as tabindex from './rules/tabindex.js';
import * as targetSize from './rules/target-size.js';

const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;

export const RULES = [
  imageAlt,
  linkName,
  buttonName,
  label,
  htmlLang,
  colorContrast,
  ariaValidAttr,
  documentTitle,
  headingOrder,
  landmark,
  tabindex,
  targetSize
];

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function applyFixersToFile(code, filename, enabledRuleIds = null, customSuggestions = {}) {
  const appliedFixes = [];
  let ast;

  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      sourceFilename: filename
    });
  } catch (err) {
    logger.warn(`Failed to parse ${filename}: ${err.message}`);
    return { code, appliedFixes: [], hasChanges: false };
  }

  const activeRules = RULES.filter(r => !enabledRuleIds || enabledRuleIds.includes(r.id));

  traverse(ast, {
    JSXOpeningElement(jsxPath) {
      const loc = jsxPath.node.loc?.start;
      const line = loc ? loc.line : null;
      const dataLoc = `${path.basename(filename)}:${line}`;

      for (const rule of activeRules) {
        if (rule.detect && rule.detect(jsxPath.node, jsxPath.parent)) {
          const suggestedText = customSuggestions[rule.id] || customSuggestions[dataLoc];
          const lines = code.split('\n');
          const beforeSnippet = lines.slice(Math.max(0, (line || 1) - 2), Math.min(lines.length, (line || 1) + 2)).join('\n');

          const fixResult = rule.fix(jsxPath, { suggestedText });
          if (fixResult && fixResult.fixed) {
            appliedFixes.push({
              fixId: `fix-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              file: filename,
              line,
              dataLoc,
              ruleId: rule.id,
              wcagCriterion: rule.wcagCriterion,
              status: fixResult.status || rule.status,
              confidence: fixResult.confidence || rule.confidence,
              details: fixResult.details,
              beforeCode: beforeSnippet,
              afterCode: ''
            });
            break;
          }
        }
      }
    }
  });

  if (appliedFixes.length === 0) {
    return { code, appliedFixes: [], hasChanges: false };
  }

  const output = generate(ast, { retainLines: false }, code);
  return {
    code: output.code,
    appliedFixes,
    hasChanges: true
  };
}

export async function orchestrateFixAndVerify({
  initialScan,
  sourceDir,
  targetUrl,
  sandboxDir,
  backupDir,
  enabledRules = null,
  customSuggestions = {}
}) {
  logger.info(`Orchestrating fix in sandbox: ${sandboxDir}`);

  // 1. Copy project to sandbox
  copyDirSync(sourceDir, sandboxDir);

  const appliedFixes = [];
  const diffs = [];
  const changedFiles = [];

  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const relPath = path.relative(sandboxDir, fullPath).replace(/\\/g, '/');
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.git') walk(fullPath);
      } else {
        const ext = path.extname(file).toLowerCase();

        if (ext === '.html') {
          const original = fs.readFileSync(fullPath, 'utf8');
          let modified = original;

          if (!enabledRules || enabledRules.includes('html-has-lang')) {
            const langRes = htmlLang.fixHtmlString(modified);
            if (langRes.fixed) {
              modified = langRes.content;
              appliedFixes.push({
                fixId: `fix-html-lang-${Date.now()}`,
                file: relPath,
                line: 2,
                ruleId: 'html-has-lang',
                wcagCriterion: 'WCAG 3.1.1 Language of Page',
                status: 'CERTIFIED',
                confidence: 1.0,
                details: langRes.details
              });
            }
          }

          if (modified !== original) {
            fs.writeFileSync(fullPath, modified, 'utf8');
            diffs.push({
              file: relPath,
              patch: generateUnifiedDiff(relPath, original, modified),
              original,
              modified
            });
            changedFiles.push(relPath);
          }
        }

        if (['.jsx', '.js', '.tsx', '.ts'].includes(ext)) {
          const original = fs.readFileSync(fullPath, 'utf8');
          const result = applyFixersToFile(original, relPath, enabledRules, customSuggestions);

          if (result.hasChanges) {
            fs.writeFileSync(fullPath, result.code, 'utf8');
            diffs.push({
              file: relPath,
              patch: generateUnifiedDiff(relPath, original, result.code),
              original,
              modified: result.code
            });
            changedFiles.push(relPath);
            appliedFixes.push(...result.appliedFixes);
          }
        }
      }
    }
  }

  walk(sandboxDir);

  // 2. Stage to running app if live demo site on localhost:5173
  const isLiveDemo = targetUrl && targetUrl.includes(':5173');
  if (isLiveDemo && backupDir) {
    logger.info(`Staging fixes to live demo site on ${targetUrl}`);
    fs.mkdirSync(backupDir, { recursive: true });
    if (fs.existsSync(path.join(sourceDir, 'index.html'))) {
      fs.copyFileSync(path.join(sourceDir, 'index.html'), path.join(backupDir, 'index.html'));
      fs.copyFileSync(path.join(sandboxDir, 'index.html'), path.join(sourceDir, 'index.html'));
    }
    if (fs.existsSync(path.join(sourceDir, 'src/App.jsx'))) {
      fs.copyFileSync(path.join(sourceDir, 'src/App.jsx'), path.join(backupDir, 'App.jsx'));
      fs.copyFileSync(path.join(sandboxDir, 'src/App.jsx'), path.join(sourceDir, 'src/App.jsx'));
    }
    await new Promise(r => setTimeout(r, 1500)); // wait for Vite HMR
  }

  // 3. Re-scan target URL
  logger.info(`Running verification re-scan on ${targetUrl}`);
  const postScan = await runScan(targetUrl);

  // 4. Check for regressions
  const beforeRuleSet = new Set(initialScan.violations.map(v => v.id));
  const newRegressions = postScan.violations.filter(v => !beforeRuleSet.has(v.id));

  if (newRegressions.length > 0 && backupDir) {
    logger.warn(`Regression detected: ${newRegressions.map(r => r.id).join(', ')}. Triggering automatic rollback...`);
    restoreBackup(backupDir, sourceDir);
    const rollbackScan = await runScan(targetUrl);
    return {
      status: 'ROLLED_BACK',
      message: 'Fixes caused new accessibility violations and were safely rolled back.',
      regressions: newRegressions,
      initialScan,
      postScan: rollbackScan,
      verifiedFixes: appliedFixes.map(f => ({ ...f, status: 'ROLLED_BACK' })),
      scoreBefore: initialScan.score,
      scoreAfter: rollbackScan.score,
      scoreDelta: 0,
      diffs,
      changedFiles
    };
  }

  // 5. Update certification status per honesty rules
  const verifiedFixes = appliedFixes.map(fix => {
    const postHasViolation = postScan.violations.some(v => v.id === fix.ruleId);
    let finalStatus = fix.status;

    if (!postHasViolation) {
      if (['color-contrast', 'html-has-lang', 'label'].includes(fix.ruleId)) {
        finalStatus = 'CERTIFIED';
      } else {
        finalStatus = 'NEEDS_REVIEW'; // Alt text, button names require human confirmation
      }
    } else {
      finalStatus = 'UNFIXABLE';
    }

    return {
      ...fix,
      status: finalStatus,
      verified: !postHasViolation,
      postScanWitness: {
        reScanTimestamp: postScan.timestamp,
        ruleCleared: !postHasViolation
      }
    };
  });

  return {
    status: 'VERIFIED',
    initialScan,
    postScan,
    verifiedFixes,
    scoreBefore: initialScan.score,
    scoreAfter: postScan.score,
    scoreDelta: postScan.score - initialScan.score,
    diffs,
    changedFiles,
    beforeScreenshot: initialScan.screenshot,
    afterScreenshot: postScan.screenshot
  };
}
