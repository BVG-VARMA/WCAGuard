import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { normalizeViolations } from './normalize.js';
import { calculateScore } from '../score/score.js';
import { logger } from '../utils/logger.js';

/**
 * Scans a given URL for WCAG violations using Playwright and Axe-core.
 */
export async function runScan(url, options = {}) {
  const timeout = options.timeout || 30000;
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };

  let browser;
  try {
    logger.info(`Starting browser scan for: ${url}`);
    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      bypassCSP: true,
      serviceWorkers: 'block',
      extraHTTPHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout });
    } catch {
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
    }

    // Capture screenshot as base64 data URI
    const screenshotBuffer = await page.screenshot({ fullPage: true, type: 'png' });
    const screenshot = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

    // Run Axe analysis covering all WCAG guidelines (2.0, 2.1, 2.2 Level A, AA, AAA, and best practices)
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();

    const rawViolations = [...(axeResults.violations || [])];

    // Include incomplete audits (such as video-caption - WCAG 1.2.2 Captions Prerecorded)
    for (const inc of axeResults.incomplete || []) {
      if (inc.nodes && inc.nodes.length > 0) {
        rawViolations.push({
          id: inc.id,
          impact: inc.impact || 'serious',
          description: inc.description,
          help: inc.help,
          helpUrl: inc.helpUrl,
          tags: inc.tags || ['wcag2a', 'wcag122'],
          nodes: inc.nodes
        });
      }
    }

    // Additional WCAG rule verifications via DOM evaluation:

    // 0. WCAG 1.1.1 Non-text Content: Images must have an alt attribute with descriptive text
    try {
      const imageAltAudit = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const failing = [];
        const passingSelectors = [];

        for (const img of images) {
          const hasAlt = img.hasAttribute('alt');
          const altVal = (img.getAttribute('alt') || '').trim();
          const ariaLabel = (img.getAttribute('aria-label') || '').trim();
          const ariaLabelledby = (img.getAttribute('aria-labelledby') || '').trim();

          const hasDescription = Boolean(altVal || ariaLabel || ariaLabelledby);
          const sel = img.id ? '#' + img.id : (img.className ? '.' + img.className.trim().split(/\s+/).join('.') : 'img');

          if (hasDescription) {
            passingSelectors.push(sel);
          } else {
            // Missing alt or alt has no description
            const failureReason = hasAlt
              ? `Image has alt attribute but no description (alt="${img.getAttribute('alt')}"). An accessible description is required per WCAG 1.1.1.`
              : 'Image is missing an alt attribute and description. An accessible description is required per WCAG 1.1.1.';
            failing.push({
              target: [sel],
              html: img.outerHTML.substring(0, 200),
              failureSummary: failureReason
            });
          }
        }
        return { failing, passingSelectors };
      });

      // Filter out any nodes from axe-core that actually DO have descriptions
      const existingAltViolation = rawViolations.find(v => v.id === 'image-alt');
      if (existingAltViolation) {
        // Remove false positives if any passed our description check
        existingAltViolation.nodes = existingAltViolation.nodes.filter(n => {
          const targetStr = Array.isArray(n.target) ? n.target[0] : String(n.target);
          return !imageAltAudit.passingSelectors.includes(targetStr);
        });

        // Add any failing images caught by our description check
        for (const failNode of imageAltAudit.failing) {
          const alreadyListed = existingAltViolation.nodes.some(n => {
            const targetStr = Array.isArray(n.target) ? n.target[0] : String(n.target);
            return targetStr === failNode.target[0] || n.html === failNode.html;
          });
          if (!alreadyListed) {
            existingAltViolation.nodes.push(failNode);
          }
        }

        // If all nodes passed, remove the violation completely
        if (existingAltViolation.nodes.length === 0) {
          const index = rawViolations.indexOf(existingAltViolation);
          if (index > -1) rawViolations.splice(index, 1);
        }
      } else if (imageAltAudit.failing.length > 0) {
        rawViolations.push({
          id: 'image-alt',
          impact: 'serious',
          description: 'Ensure <img> elements have an alt attribute with descriptive text',
          help: 'Images must have an alt attribute with meaningful descriptive text (WCAG 1.1.1)',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
          tags: ['wcag2a', 'wcag111'],
          nodes: imageAltAudit.failing
        });
      }
    } catch {
      // ignore eval error
    }

    // 1. WCAG 2.4.4 Link Purpose: Ambiguous generic link text ("Click here", "read more", etc.)
    try {
      const genericLinks = await page.evaluate(() => {
        const GENERIC_REGEX = /^(click here|here|more|read more|learn more|link|view|details)$/i;
        const links = Array.from(document.querySelectorAll('a[href]'));
        return links.filter(a => {
          const text = (a.innerText || a.textContent || '').trim();
          const ariaLabel = (a.getAttribute('aria-label') || '').trim();
          return GENERIC_REGEX.test(text) && !ariaLabel;
        }).map(a => {
          const sel = a.id ? '#' + a.id : 'a[href="' + a.getAttribute('href') + '"]';
          return {
            target: [sel],
            html: a.outerHTML,
            failureSummary: `Link text "${a.innerText.trim()}" is ambiguous and fails WCAG 2.4.4 Link Purpose.`
          };
        });
      });

      if (genericLinks.length > 0 && !rawViolations.some(v => v.id === 'link-name')) {
        rawViolations.push({
          id: 'link-name',
          impact: 'serious',
          description: 'Ensure links have discernible and descriptive purpose in context',
          help: 'Links must have descriptive text that explains their destination (avoid "click here")',
          tags: ['wcag2a', 'wcag244'],
          nodes: genericLinks
        });
      }
    } catch {
      // ignore eval error
    }

    // 2. WCAG 2.5.8 Target Size: Minimum 24x24 CSS pixels for interactive controls
    try {
      const smallTargets = await page.evaluate(() => {
        const targets = Array.from(document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"]'));
        return targets.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && (rect.width < 24 || rect.height < 24);
        }).map(el => {
          const rect = el.getBoundingClientRect();
          const sel = el.id ? '#' + el.id : (el.className ? '.' + el.className.trim().split(/\s+/).join('.') : el.tagName.toLowerCase());
          return {
            target: [sel],
            html: el.outerHTML,
            failureSummary: `Element dimensions (${Math.round(rect.width)}x${Math.round(rect.height)}px) fail WCAG 2.5.8 target size minimum (24x24px).`
          };
        });
      });

      if (smallTargets.length > 0 && !rawViolations.some(v => v.id === 'target-size')) {
        rawViolations.push({
          id: 'target-size',
          impact: 'moderate',
          description: 'Ensure touch targets have sufficient size (minimum 24x24 CSS pixels)',
          help: 'Interactive controls must meet the 24x24px target size minimum',
          tags: ['wcag22aa', 'wcag258'],
          nodes: smallTargets
        });
      }
    } catch {
      // ignore eval error
    }

    // 3. WCAG 1.3.1 Info & Relationships: Data tables missing <th> header cells
    try {
      const tablesWithoutHeaders = await page.evaluate(() => {
        const tables = Array.from(document.querySelectorAll('table'));
        return tables.filter(t => t.querySelectorAll('td').length > 0 && t.querySelectorAll('th').length === 0).map(t => {
          const sel = t.id ? '#' + t.id : 'table';
          return {
            target: [sel],
            html: t.outerHTML.substring(0, 160),
            failureSummary: 'Data table contains <td> data cells but zero <th> header cells or caption.'
          };
        });
      });

      if (tablesWithoutHeaders.length > 0 && !rawViolations.some(v => v.id === 'table-missing-headers')) {
        rawViolations.push({
          id: 'table-missing-headers',
          impact: 'serious',
          description: 'Data tables must contain header cells (<th>) to establish relationships',
          help: 'Data tables require <th> elements with scope="col" or scope="row"',
          tags: ['wcag2a', 'wcag131'],
          nodes: tablesWithoutHeaders
        });
      }
    } catch {
      // ignore eval error
    }

    // 4. WCAG 2.2.2 Pause, Stop, Hide: Moving or sliding content without pause control
    try {
      const movingAnimations = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('*'));
        return all.filter(el => {
          const style = window.getComputedStyle(el);
          const animName = style.animationName;
          const animIter = style.animationIterationCount;
          return animName && animName !== 'none' && animIter === 'infinite';
        }).map(el => {
          const sel = el.id ? '#' + el.id : (el.className ? '.' + el.className.trim().split(/\s+/).join('.') : el.tagName.toLowerCase());
          return {
            target: [sel],
            html: el.outerHTML.substring(0, 160),
            failureSummary: `Element runs infinite animation "${window.getComputedStyle(el).animationName}" with no pause or stop control.`
          };
        });
      });

      if (movingAnimations.length > 0 && !rawViolations.some(v => v.id === 'moving-content-no-pause')) {
        rawViolations.push({
          id: 'moving-content-no-pause',
          impact: 'moderate',
          description: 'Moving or sliding content that starts automatically must have a pause control',
          help: 'Provide a pause or stop mechanism for continuous moving animations',
          tags: ['wcag2a', 'wcag222'],
          nodes: movingAnimations
        });
      }
    } catch {
      // ignore eval error
    }

    // Map DOM selectors to data-loc attributes
    const domLocators = new Map();
    for (const v of rawViolations) {
      for (const node of v.nodes) {
        const selector = Array.isArray(node.target) ? node.target.join(' ') : String(node.target);
        try {
          const loc = await page.evaluate((sel) => {
            try {
              const el = document.querySelector(sel);
              return el ? el.getAttribute('data-loc') : null;
            } catch {
              return null;
            }
          }, selector);
          if (loc) domLocators.set(selector, loc);
        } catch {
          // Ignore DOM evaluate errors
        }
      }
    }

    const violations = normalizeViolations(rawViolations, domLocators);
    const scoreData = calculateScore(violations);

    return {
      url,
      scanId: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      score: scoreData.score,
      scoreDetails: scoreData,
      totalViolations: scoreData.totalViolations,
      violations,
      passesCount: axeResults.passes?.length || 0,
      incompleteCount: axeResults.incomplete?.length || 0,
      screenshot
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
