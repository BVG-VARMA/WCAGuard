import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const recordingsDir = path.join(__dirname, '..', 'recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

// Clean old video files in recordings directory
try {
  const existingFiles = fs.readdirSync(recordingsDir);
  for (const f of existingFiles) {
    if (f.endsWith('.webm')) {
      fs.unlinkSync(path.join(recordingsDir, f));
    }
  }
} catch (e) {
  // ignore
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Injects realistic animated cursor, lower-third presentation subtitles, and fade overlay
 */
async function injectPresentationOverlay(page) {
  await page.evaluate(() => {
    // Prevent duplicate injection
    if (document.getElementById('demo-overlay-container')) return;

    const container = document.createElement('div');
    container.id = 'demo-overlay-container';
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    // 1. Realistic Animated Cursor
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 26px;
      height: 26px;
      pointer-events: none;
      z-index: 1000000;
      transform: translate3d(640px, 360px, 0);
      transition: transform 0.08s ease-out, filter 0.15s ease;
      filter: drop-shadow(0 2px 5px rgba(0,0,0,0.45));
    `;
    cursor.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 3.2L18.5 12.3L12.5 13.8L9.2 19.8L5.5 3.2Z" fill="#0B192C" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="6" cy="4" r="1.5" fill="#10B981" />
      </svg>
      <div id="demo-cursor-ripple" style="position:absolute;top:2px;left:4px;width:16px;height:16px;border-radius:50%;border:2px solid #10B981;opacity:0;transform:scale(0.4);transition:all 0.3s ease-out;pointer-events:none;"></div>
    `;

    // 2. Professional Lower-Third Caption Pill
    const captionBox = document.createElement('div');
    captionBox.id = 'demo-caption-banner';
    captionBox.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999998;
      background: rgba(11, 25, 44, 0.94);
      border: 1px solid rgba(52, 211, 153, 0.4);
      border-radius: 16px;
      padding: 10px 24px;
      color: #FFFFFF;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(12px);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      max-width: 860px;
      width: auto;
      text-align: center;
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    captionBox.innerHTML = `
      <div id="demo-caption-title" style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:#34D399;">
        <span>🛡️ WCAGuard Platform</span>
      </div>
      <div id="demo-caption-desc" style="font-size:13px;font-weight:500;color:#E2E8F0;line-height:1.4;">
        Automated WCAG 2.1 & 2.2 AA Accessibility Remediation Engine
      </div>
    `;

    // 3. Smooth Fade-out Curtain
    const fadeOut = document.createElement('div');
    fadeOut.id = 'demo-fadeout';
    fadeOut.style.cssText = 'position:fixed;inset:0;background:#050914;opacity:0;pointer-events:none;z-index:1000005;transition:opacity 2.2s cubic-bezier(0.4, 0, 0.2, 1);';

    container.appendChild(cursor);
    container.appendChild(captionBox);
    container.appendChild(fadeOut);
    document.body.appendChild(container);
  });
}

/**
 * Updates caption lower-third overlay
 */
async function setCaption(page, title, description) {
  try {
    await page.evaluate(({ t, d }) => {
      const titleEl = document.getElementById('demo-caption-title');
      const descEl = document.getElementById('demo-caption-desc');
      const box = document.getElementById('demo-caption-banner');
      if (box) {
        box.style.opacity = '0';
        box.style.transform = 'translateX(-50%) translateY(4px)';
        setTimeout(() => {
          if (titleEl) titleEl.innerHTML = t;
          if (descEl) descEl.textContent = d;
          box.style.opacity = '1';
          box.style.transform = 'translateX(-50%) translateY(0)';
        }, 150);
      }
    }, { t: title, d: description });
  } catch (e) {
    // ignore
  }
}

/**
 * Smoothly moves cursor to coordinates
 */
async function smoothMoveTo(page, targetX, targetY, steps = 18, delay = 25) {
  const currentPos = await page.evaluate(() => {
    const el = document.getElementById('demo-cursor');
    if (!el) return { x: 640, y: 360 };
    const transform = el.style.transform;
    const match = transform.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/);
    if (match) return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
    return { x: 640, y: 360 };
  });

  const dx = (targetX - currentPos.x) / steps;
  const dy = (targetY - currentPos.y) / steps;

  for (let i = 1; i <= steps; i++) {
    const nextX = currentPos.x + dx * i;
    const nextY = currentPos.y + dy * i;
    await page.evaluate(({ x, y }) => {
      const el = document.getElementById('demo-cursor');
      if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, { x: nextX, y: nextY });
    await page.mouse.move(nextX, nextY);
    await sleep(delay);
  }
}

/**
 * Smoothly moves to an element, hovers, and clicks with visual ripple
 */
async function smoothClick(page, locator, options = {}) {
  const box = await locator.boundingBox();
  if (!box) {
    await locator.click();
    return;
  }

  const targetX = box.x + box.width / 2;
  const targetY = box.y + box.height / 2;

  await smoothMoveTo(page, targetX, targetY, options.steps || 16, 22);
  await sleep(180);

  // Trigger ripple animation
  await page.evaluate(() => {
    const ripple = document.getElementById('demo-cursor-ripple');
    if (ripple) {
      ripple.style.opacity = '0.9';
      ripple.style.transform = 'scale(1.8)';
      setTimeout(() => {
        ripple.style.opacity = '0';
        ripple.style.transform = 'scale(0.4)';
      }, 260);
    }
  });

  await locator.click();
  await sleep(options.postDelay || 350);
}

/**
 * Types text with human-like key delays
 */
async function smoothType(page, locator, text, delayMs = 45) {
  await smoothClick(page, locator, { postDelay: 150 });
  await locator.fill('');
  for (const char of text) {
    await locator.pressSequentially(char, { delay: delayMs });
  }
  await sleep(250);
}

/**
 * Smooth page scroll helper
 */
async function smoothScroll(page, distance, steps = 18, stepDelay = 45) {
  const delta = distance / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), delta);
    await sleep(stepDelay);
  }
}

/**
 * Activates dark fade-out transition
 */
async function triggerFadeOut(page) {
  await page.evaluate(() => {
    const fade = document.getElementById('demo-fadeout');
    if (fade) fade.style.opacity = '1';
  });
  await sleep(2400);
}

async function run() {
  console.log('🎬 Initializing WCAGuard College Expo Standalone Video Recording...');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  // Helper to re-inject presentation overlays after page loads
  page.on('load', async () => {
    try {
      await injectPresentationOverlay(page);
    } catch (e) {
      // ignore
    }
  });

  // =========================================================================
  // SCENE 1 — INTRODUCTION
  // =========================================================================
  console.log('📽️ SCENE 1: Introduction...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await injectPresentationOverlay(page);
  await setCaption(
    page,
    '<span>🛡️ SCENE 1: INTRODUCTION • WCAGuard Platform</span>',
    'Automated WCAG 2.1 & 2.2 AA Remediation Engine — "Find it. Fix it. Prove it."'
  );
  await sleep(2200);

  // Subtle cursor glide over the hero badge and project title
  await smoothMoveTo(page, 640, 210, 20, 25);
  await sleep(1500);
  await smoothMoveTo(page, 640, 290, 16, 25);
  await sleep(1800);

  // =========================================================================
  // SCENE 2 — HOMEPAGE
  // =========================================================================
  console.log('📽️ SCENE 2: Homepage Overview & Architecture...');
  await setCaption(
    page,
    '<span>🏛️ SCENE 2: HOMEPAGE • Architecture & Core Workflow</span>',
    'Exploring the 4-phase audit lifecycle: Scan, Repair, Verify, and Certify.'
  );
  await sleep(1200);

  // Scroll through the 4 feature cards
  await smoothScroll(page, 480, 18, 45);
  await sleep(2000);
  await smoothMoveTo(page, 320, 320, 16, 25);
  await sleep(1200);
  await smoothMoveTo(page, 640, 320, 16, 25);
  await sleep(1200);

  // Scroll down to the interactive architecture flowchart
  await smoothScroll(page, 580, 18, 45);
  await setCaption(
    page,
    '<span>🔄 SCENE 2: SYSTEM ARCHITECTURE • Automated Pipeline</span>',
    'Playwright DOM Scanner → Babel AST Fixer → Zero-Regression Recheck → Cryptographic Proof.'
  );
  await sleep(2500);

  // Smooth scroll back to top
  await smoothScroll(page, -1060, 24, 35);
  await sleep(1500);

  // =========================================================================
  // SCENE 3 — USER ACTION (AUTHENTICATION)
  // =========================================================================
  console.log('📽️ SCENE 3: User Action & Secure Login...');
  await setCaption(
    page,
    '<span>🔐 SCENE 3: USER ACTION • Auditor Authentication</span>',
    'Accessing the platform via verified auditor credentials with zero-knowledge security.'
  );
  await sleep(1500);

  const signInBtn = page.locator('button:has-text("Sign In")').first();
  await smoothClick(page, signInBtn);
  await sleep(1800);

  // Focus and type credentials realistically
  const emailInput = page.locator('#login-email');
  await setCaption(
    page,
    '<span>👤 SCENE 3: CREDENTIALS • Verified Email Authentication</span>',
    'Entering auditor email and password into the encrypted authentication form.'
  );
  await smoothType(page, emailInput, 'demo@wcaguard.com', 40);
  await sleep(400);

  const passwordInput = page.locator('#login-password');
  await smoothType(page, passwordInput, 'Demo123!', 45);
  await sleep(500);

  const submitLoginBtn = page.locator('button[type="submit"]:has-text("Login")').first();
  await smoothClick(page, submitLoginBtn);
  await sleep(2500);

  // =========================================================================
  // SCENE 4 — MAIN FEATURE: LIVE DOM URL ACCESSIBILITY SCAN
  // =========================================================================
  console.log('📽️ SCENE 4: Main Feature - Live DOM URL Scan...');
  await setCaption(
    page,
    '<span>🌐 SCENE 4: MAIN FEATURE • Live DOM Accessibility Scan</span>',
    'Targeting local development application (http://localhost:5173) with axe-core and Chromium.'
  );
  await sleep(1600);

  // Switch to URL Tab
  const urlTab = page.locator('button[role="tab"]:has-text("URL"), #tab-url').first();
  if (await urlTab.isVisible()) {
    await smoothClick(page, urlTab);
    await sleep(800);
  }

  // Switch to Local Development Mode radio
  const localRadio = page.locator('input[type="radio"][value="local"]');
  if (await localRadio.isVisible()) {
    await smoothClick(page, localRadio);
    await sleep(800);
  }

  // Type target URL
  const targetUrlInput = page.locator('#target-url-input');
  await smoothType(page, targetUrlInput, 'http://localhost:5173', 40);
  await sleep(700);

  // Launch Scan
  setCaption(
    page,
    '<span>⚡ SCENE 4: RUNNING AUDIT • Axe-core Engine Processing</span>',
    'Headless browser evaluating WCAG 2.1 & 2.2 AA rules, contrast ratios, and interactive states...'
  );
  const runScanBtn = page.locator('button[type="submit"]:has-text("Run Accessibility Scan")').first();
  await smoothClick(page, runScanBtn);

  // Wait for scan results
  await page.waitForSelector('text=What to Change Remediation Guidance', { timeout: 45000 });
  await sleep(2500);

  // =========================================================================
  // SCENE 5 — RESULT: WHAT TO CHANGE REPORT & VIOLATIONS
  // =========================================================================
  console.log('📽️ SCENE 5: Results - What to Change Guidance & Score...');
  await setCaption(
    page,
    '<span>📊 SCENE 5: AUDIT RESULT • What to Change Remediation Guidance</span>',
    'Live DOM Audit Complete: Compliance Score (52/100) and actionable accessibility violations.'
  );
  await sleep(2200);

  // Move cursor across Compliance Score and severity metrics
  await smoothMoveTo(page, 380, 220, 16, 25);
  await sleep(1500);
  await smoothMoveTo(page, 820, 220, 16, 25);
  await sleep(1500);

  // Scroll through violation cards
  await smoothScroll(page, 480, 18, 45);
  await setCaption(
    page,
    '<span>🔍 SCENE 5: DETAILED VIOLATIONS • Pinpoint Remediation Guidance</span>',
    'Clear developer recommendations for missing image alt text, low contrast, and unlabelled controls.'
  );
  await sleep(2800);

  await smoothScroll(page, 480, 18, 45);
  await sleep(2400);

  // Showcase the Re-scan button
  const rescanBtn = page.locator('button:has-text("Re-scan Updated Webpage")').first();
  if (await rescanBtn.isVisible()) {
    await smoothMoveTo(page, 640, 520, 16, 25);
    await sleep(1800);
  }

  // Scroll back to top
  await smoothScroll(page, -960, 22, 35);
  await sleep(1200);

  // =========================================================================
  // SCENE 6 — SECONDARY FEATURES: CODE REMEDIATION, AST DIFF, MATRIX, PITCH DECK
  // =========================================================================
  console.log('📽️ SCENE 6A: Feature 1 - React & HTML AST Code Remediation...');
  await setCaption(
    page,
    '<span>💻 SCENE 6A: CODE REMEDIATION • Deterministic Babel AST Engine</span>',
    'Inspecting source code statically to synthesize safe, verifiable WCAG 2.1 AA fixes.'
  );
  await sleep(1400);

  // Navigate to Scan & Audit Studio
  const scanAuditNav = page.locator('button:has-text("Scan & Audit")').first();
  await smoothClick(page, scanAuditNav);
  await sleep(1500);

  // Switch to React & HTML code tab
  const codeTab = page.locator('button[role="tab"]:has-text("React & HTML code"), #tab-code').first();
  if (await codeTab.isVisible()) {
    await smoothClick(page, codeTab);
    await sleep(800);
  }

  // Enter broken component code with missing alt, unlabelled button, and missing form label
  const sampleCode = `import React from 'react';

export default function CheckoutForm() {
  return (
    <div className="checkout-container">
      <img src="product.jpg" />
      <button className="submit-btn"></button>
      <input type="text" placeholder="Full Name" />
      <a href="/terms">Click here</a>
    </div>
  );
}`;

  const codeTextarea = page.locator('#code-input');
  await smoothClick(page, codeTextarea, { postDelay: 100 });
  await codeTextarea.fill(sampleCode);
  await sleep(1400);

  // Run Analyze and Repair Code
  await setCaption(
    page,
    '<span>⚙️ SCENE 6A: AST REPAIR • Zero-Execution Static Transformation</span>',
    'Executing deterministic AST rewrite for image-alt, button-name, and input form labels...'
  );
  const analyzeBtn = page.locator('button[type="submit"]:has-text("Analyze and Repair Code")').first();
  await smoothClick(page, analyzeBtn);

  // Wait for Results Workspace
  await page.waitForSelector('text=Candidate Accessibility Transformations Review', { timeout: 25000 });
  await sleep(2200);

  // Show Candidate Transformations and Diffs
  await setCaption(
    page,
    '<span>✨ SCENE 6A: VERIFIED FIXES • Side-by-Side AST Diff & Approvals</span>',
    'Compliance Score boosted: 91 → 98 (+7 pts). Deterministic AST transformations ready for review.'
  );
  await smoothScroll(page, 420, 16, 45);
  await sleep(2200);

  // Switch to Side-by-Side Diff Tab
  const diffTab = page.locator('button[role="tab"]:has-text("Side-by-Side Diff")').first();
  if (await diffTab.isVisible()) {
    await smoothClick(page, diffTab);
    await sleep(2500);
  }

  // Apply All & Show Code
  const applyAllBtn = page.locator('button:has-text("Apply All & Show Code")').first();
  if (await applyAllBtn.isVisible()) {
    await smoothClick(page, applyAllBtn);
    await sleep(2400);
  }

  // Switch to Corrected Code Tab & show downloadable buttons
  await setCaption(
    page,
    '<span>💾 SCENE 6A: CORRECTED CODE • Instant Download & Export</span>',
    'Verified source code with zero regressions. Exportable as fixed file, JSON report, or PDF certificate.'
  );
  await smoothScroll(page, -350, 16, 40);
  await sleep(1500);

  const downloadCodeBtn = page.locator('button:has-text("Download Updated Code")').first();
  if (await downloadCodeBtn.isVisible()) {
    await smoothMoveTo(page, 860, 240, 16, 25);
    await sleep(1500);
  }

  // Feature 2: WCAG Scope / Coverage Matrix
  console.log('📽️ SCENE 6B: Feature 2 - WCAG Scope & Coverage Matrix...');
  await setCaption(
    page,
    '<span>🎯 SCENE 6B: STANDARDS SCOPE • WCAG 2.1 & 2.2 Coverage Matrix</span>',
    'Auditing compliance across Perceptible, Operable, Understandable, and Robust principles.'
  );
  const scopeNav = page.locator('button:has-text("Scope")').first();
  if (await scopeNav.isVisible()) {
    await smoothClick(page, scopeNav);
    await sleep(2200);
    await smoothScroll(page, 450, 16, 45);
    await sleep(2000);
    await smoothScroll(page, -450, 16, 40);
    await sleep(1200);
  }

  // Feature 3: Pitch Deck
  console.log('📽️ SCENE 6C: Feature 3 - Interactive Expo Pitch Deck...');
  await setCaption(
    page,
    '<span>📈 SCENE 6C: EXPO PRESENTATION • Interactive Project Pitch Deck</span>',
    '7-slide project presentation tailored for university expos, evaluators, and technical judges.'
  );
  const deckNav = page.locator('button:has-text("Pitch Deck")').first();
  if (await deckNav.isVisible()) {
    await smoothClick(page, deckNav);
    await sleep(2200);
    await smoothScroll(page, 450, 16, 45);
    await sleep(2000);
    await smoothScroll(page, -450, 16, 40);
    await sleep(1200);
  }

  // =========================================================================
  // SCENE 7 — COMPLETE USER JOURNEY: PROOF & CERTIFICATES
  // =========================================================================
  console.log('📽️ SCENE 7: Complete User Journey - Proof & Cryptographic Certificates...');
  await setCaption(
    page,
    '<span>📜 SCENE 7: COMPLETE JOURNEY • Cryptographic Audit Certificates</span>',
    'Tamper-evident verification certificates sealed with SHA-256 witnesses for compliance assurance.'
  );
  const proofNav = page.locator('button:has-text("Proof & Certificates")').first();
  if (await proofNav.isVisible()) {
    await smoothClick(page, proofNav);
    await sleep(2200);
    await smoothScroll(page, 450, 16, 45);
    await sleep(2200);
    await smoothScroll(page, -450, 16, 40);
    await sleep(1400);
  }

  // =========================================================================
  // SCENE 8 — FINAL SCREEN & PROFESSIONAL FADE OUT
  // =========================================================================
  console.log('📽️ SCENE 8: Final Screen & Professional Fade-Out...');
  await setCaption(
    page,
    '<span>🏁 SCENE 8: CONCLUSION • WCAGuard Platform</span>',
    'Autonomous Web Accessibility Remediation & Proof Engine — "Find it. Fix it. Prove it."'
  );
  const homeNav = page.locator('button:has-text("Home")').first();
  await smoothClick(page, homeNav);
  await sleep(2500);

  // Center cursor smoothly on brand logo
  await smoothMoveTo(page, 640, 260, 20, 25);
  await sleep(2000);

  // Execute professional fade-out
  console.log('✨ Triggering final professional fade-out...');
  await triggerFadeOut(page);

  console.log('💾 Closing browser context to finalize HD 16:9 recording...');
  await page.close();
  await context.close();
  await browser.close();

  // Find the generated video file
  const videoFiles = fs.readdirSync(recordingsDir).filter((f) => f.endsWith('.webm'));
  if (videoFiles.length === 0) {
    throw new Error('No .webm video file found in recordings directory!');
  }

  // Sort by modification time to find the newest recording
  videoFiles.sort((a, b) => {
    return (
      fs.statSync(path.join(recordingsDir, b)).mtimeMs -
      fs.statSync(path.join(recordingsDir, a)).mtimeMs
    );
  });

  const sourceVideo = path.join(recordingsDir, videoFiles[0]);
  const destWorkspace = path.join(__dirname, '..', 'WCAGuard_College_Expo_Demonstration.webm');

  // Also copy to artifacts directory for direct user download
  const artifactDir = 'C:\\Users\\venug\\.gemini\\antigravity-ide\\brain\\72f35702-4bc3-4941-9fb5-ff0d2b756c89';
  const destArtifact = path.join(artifactDir, 'WCAGuard_College_Expo_Demonstration.webm');

  fs.copyFileSync(sourceVideo, destWorkspace);
  try {
    fs.copyFileSync(sourceVideo, destArtifact);
  } catch (err) {
    console.warn('Could not copy to artifacts dir:', err.message);
  }

  const stats = fs.statSync(destWorkspace);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n================================================================`);
  console.log(`🎉 STANDALONE DEMONSTRATION VIDEO GENERATED SUCCESSFULLY!`);
  console.log(`📍 File Path:     ${destWorkspace}`);
  if (fs.existsSync(destArtifact)) {
    console.log(`📍 Artifact Path: ${destArtifact}`);
  }
  console.log(`📦 Video Size:    ${sizeMB} MB`);
  console.log(`🎞️ Format:        WebM (VP8/VP9 HD 1280x720, 16:9 Landscape)`);
  console.log(`================================================================\n`);
}

run().catch((err) => {
  console.error('❌ Error recording demo video:', err);
  process.exit(1);
});
