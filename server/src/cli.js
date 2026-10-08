#!/usr/bin/env node

/**
 * WCAGuard - Command Line Interface
 * Commands:
 *   npx wcaguard scan <url>
 *   npx wcaguard fix <path>
 */

import { runScan } from './scanner/scanner.js';
import { orchestrateFixAndVerify } from './fixer/fixer.js';
import path from 'path';
import fs from 'fs';

const args = process.argv.slice(2);
const command = args[0];
const target = args[1];

function printHelp() {
  console.log(`
🛡️  WCAGuard CLI - Find it. Fix it. Prove it.
Usage:
  npx wcaguard scan <url>    Run automated axe-core & Playwright scan on target URL
  npx wcaguard fix <path>    Auto-remediate React JSX files in the specified directory
  npx wcaguard help          Display this help message
`);
}

async function runCli() {
  if (!command || command === 'help' || command === '--help') {
    printHelp();
    return;
  }

  if (command === 'scan') {
    if (!target) {
      console.error('Error: Please provide a target URL to scan (e.g. npx wcaguard scan http://localhost:5173)');
      process.exit(1);
    }

    console.log(`\n🔍 Scanning URL: ${target}...`);
    try {
      const res = await runScan(target);
      console.log(`\n======================================================`);
      console.log(`🛡️  WCAGuard Scan Results`);
      console.log(`Target:               ${res.url}`);
      console.log(`Accessibility Score:  ${res.score} / 100`);
      console.log(`Total Violations:     ${res.totalViolations}`);
      console.log(`Breakdown:            Critical: ${res.scoreDetails?.countsBySeverity?.critical ?? 0}, Serious: ${res.scoreDetails?.countsBySeverity?.serious ?? 0}, Moderate: ${res.scoreDetails?.countsBySeverity?.moderate ?? 0}, Minor: ${res.scoreDetails?.countsBySeverity?.minor ?? 0}`);
      console.log(`======================================================\n`);
    } catch (err) {
      console.error('Scan failed:', err.message);
      process.exit(1);
    }
    return;
  }

  if (command === 'fix') {
    if (!target) {
      console.error('Error: Please provide a project path to remediate (e.g. npx wcaguard fix ./demo-app)');
      process.exit(1);
    }

    const fullPath = path.resolve(process.cwd(), target);
    if (!fs.existsSync(fullPath)) {
      console.error(`Error: Directory does not exist: ${fullPath}`);
      process.exit(1);
    }

    console.log(`\n🛠️  Remediating React JSX files in: ${fullPath}...`);
    try {
      const sandboxDir = path.resolve(process.cwd(), 'data/tmp', `cli-sandbox-${Date.now()}`);
      const res = await orchestrateFixAndVerify({
        sourceDir: fullPath,
        sandboxDir
      });
      console.log(`\n======================================================`);
      console.log(`🛡️  WCAGuard Remediation Completed`);
      console.log(`Total Fixes Applied:  ${res.verifiedFixes?.length ?? 0}`);
      console.log(`Files Modified:       ${res.changedFiles?.length ?? 0}`);
      console.log(`Verification:         ${res.status}`);
      console.log(`======================================================\n`);
    } catch (err) {
      console.error('Fix failed:', err.message);
      process.exit(1);
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

runCli();
