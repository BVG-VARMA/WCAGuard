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

// Clean old webm files in recordings dir
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

async function smoothScroll(page, distance, steps = 18, stepDelay = 50) {
  const delta = distance / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), delta);
    await sleep(stepDelay);
  }
}

async function run() {
  console.log('🚀 Launching Chromium for automated demo recording...');
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1280, height: 800 },
    },
  });

  const page = await context.newPage();

  // 1. Landing Page
  console.log('🎬 Step 1: Navigating to Landing Page (http://localhost:3000)...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await sleep(2500);

  console.log('📜 Showcasing Landing Page features and hero section...');
  await smoothScroll(page, 700, 20, 50);
  await sleep(2000);
  await smoothScroll(page, 800, 20, 50);
  await sleep(2000);
  await smoothScroll(page, -1500, 25, 35);
  await sleep(1500);

  // 2. Authentication Flow
  console.log('🔐 Step 2: Navigating to Sign In...');
  const signInBtn = page.locator('button:has-text("Sign In")').first();
  await signInBtn.waitFor({ state: 'visible', timeout: 5000 });
  await signInBtn.click();
  await sleep(2000);

  console.log('🔑 Populating demo credentials with "Use Demo Account"...');
  const demoAccountBtn = page.locator('button:has-text("Use Demo Account")').first();
  await demoAccountBtn.waitFor({ state: 'visible', timeout: 5000 });
  await demoAccountBtn.click();
  await sleep(1800);

  console.log('🚪 Submitting login with "Login" button...');
  const submitLoginBtn = page.locator('button[type="submit"]:has-text("Login")').first();
  await submitLoginBtn.click();
  await sleep(2500);

  // 3. Scan & Audit Studio with Pipeline Stepper
  console.log('🔍 Step 3: Exploring Accessibility Audit Studio & Pipeline Stepper...');
  await page.waitForSelector('text=Accessibility Audit & Repair Studio', { timeout: 10000 });
  await sleep(2000);

  // 4. URL Scan (Live DOM Audit of http://localhost:5173)
  console.log('🌐 Step 4: Configuring live URL scan for Demo App (http://localhost:5173)...');
  const urlTab = page.locator('button[role="tab"]:has-text("URL"), #tab-url').first();
  if (await urlTab.isVisible()) {
    await urlTab.click();
    await sleep(1200);
  }

  const localDevRadio = page.locator('input[type="radio"][value="local"]');
  if (await localDevRadio.isVisible()) {
    await localDevRadio.click();
    await sleep(1200);
  }

  const quickTestBtn = page.locator('button:has-text("Quick test with Demo App")').first();
  if (await quickTestBtn.isVisible()) {
    await quickTestBtn.click();
    await sleep(1800);
  }

  console.log('⚡ Launching live DOM audit with Playwright & axe-core...');
  const scanSubmitBtn = page.locator('button[type="submit"]:has-text("Run Accessibility Scan")').first();
  await scanSubmitBtn.click();

  // Wait for scan results
  console.log('⏳ Waiting for live DOM audit results...');
  await page.waitForSelector('text=What to Change Remediation Guidance', { timeout: 45000 });
  await sleep(3000);

  // 5. Results & "What to Change" Report
  console.log('📊 Step 5: Reviewing What to Change Report and WCAG violations...');
  await smoothScroll(page, 450, 18, 50);
  await sleep(2500);
  await smoothScroll(page, 550, 18, 50);
  await sleep(2500);

  // Showcase the Re-scan button
  const rescanBtn = page.locator('button:has-text("Re-scan Updated Webpage")').first();
  if (await rescanBtn.isVisible()) {
    await rescanBtn.scrollIntoViewIfNeeded();
    await sleep(2500);
  }

  await smoothScroll(page, -1000, 22, 35);
  await sleep(1500);

  // 6. React JSX AST Remediation Mode
  console.log('💻 Step 6: Testing React JSX AST Remediation Engine...');
  const auditStudioNav = page.locator('button:has-text("Scan & Audit")').first();
  if (await auditStudioNav.isVisible()) {
    await auditStudioNav.click();
    await sleep(1800);
  }

  const codeTab = page.locator('button[role="tab"]:has-text("React code"), #tab-code').first();
  if (await codeTab.isVisible()) {
    await codeTab.click();
    await sleep(1200);
  }

  const loadSampleBtn = page.locator('button:has-text("Load Safe Demo Code")').first();
  if (await loadSampleBtn.isVisible()) {
    await loadSampleBtn.click();
    await sleep(2000);
  }

  const analyzeCodeBtn = page.locator('button[type="submit"]:has-text("Analyze and Repair Code")').first();
  if (await analyzeCodeBtn.isVisible()) {
    await analyzeCodeBtn.click();
    console.log('⏳ Waiting for AST analysis and code fixes...');
    await sleep(4000);
  }

  // Scroll through Diff viewer
  console.log('✨ Showcasing side-by-side Diff Viewer and AST fixes...');
  await smoothScroll(page, 500, 18, 50);
  await sleep(3000);
  await smoothScroll(page, -500, 18, 40);
  await sleep(1500);

  // 7. Pitch Deck
  console.log('📈 Step 7: Presenting Pitch Deck...');
  const deckNav = page.locator('button:has-text("Pitch Deck")').first();
  if (await deckNav.isVisible()) {
    await deckNav.click();
    await sleep(2500);
    await smoothScroll(page, 650, 18, 50);
    await sleep(2500);
    await smoothScroll(page, 650, 18, 50);
    await sleep(2500);
    await smoothScroll(page, -1300, 24, 35);
    await sleep(1500);
  }

  // 8. Scope / WCAG Coverage Matrix
  console.log('🎯 Step 8: Reviewing WCAG 2.1 & 2.2 Coverage Matrix...');
  const scopeNav = page.locator('button:has-text("Scope")').first();
  if (await scopeNav.isVisible()) {
    await scopeNav.click();
    await sleep(2500);
    await smoothScroll(page, 550, 18, 50);
    await sleep(2500);
    await smoothScroll(page, -550, 18, 40);
    await sleep(1500);
  }

  // 9. History Tab
  console.log('📜 Step 9: Viewing Audit History...');
  const historyNav = page.locator('button:has-text("History")').first();
  if (await historyNav.isVisible()) {
    await historyNav.click();
    await sleep(2500);
    await smoothScroll(page, 400, 15, 50);
    await sleep(2000);
    await smoothScroll(page, -400, 15, 40);
    await sleep(1500);
  }

  // 10. Return to Home Dashboard
  console.log('🏁 Step 10: Wrapping up demo at Home Dashboard...');
  const homeNav = page.locator('button:has-text("Home")').first();
  if (await homeNav.isVisible()) {
    await homeNav.click();
    await sleep(2500);
  }

  await sleep(2000);

  console.log('💾 Closing context to finalize video recording...');
  await page.close();
  await context.close();
  await browser.close();

  // Find the generated video
  const files = fs.readdirSync(recordingsDir).filter((f) => f.endsWith('.webm'));
  if (files.length === 0) {
    throw new Error('No .webm video file found in recordings directory!');
  }

  // Sort by modification time to get the latest
  files.sort((a, b) => {
    return (
      fs.statSync(path.join(recordingsDir, b)).mtimeMs -
      fs.statSync(path.join(recordingsDir, a)).mtimeMs
    );
  });

  const latestVideo = path.join(recordingsDir, files[0]);
  const destPath = path.join(__dirname, '..', 'WCAGuard_Demo_Walkthrough.webm');

  fs.copyFileSync(latestVideo, destPath);
  const stats = fs.statSync(destPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`🎉 Demo video successfully generated!`);
  console.log(`📍 Output Path: ${destPath}`);
  console.log(`📦 File Size: ${sizeMB} MB`);
}

run().catch((err) => {
  console.error('❌ Error during demo recording:', err);
  process.exit(1);
});
