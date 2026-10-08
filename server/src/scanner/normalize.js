/**
 * WCAGuard Violation Normalizer
 * Maps axe-core violation records to common normalized violation shapes with WCAG criterion & principle.
 */

const WCAG_TAG_MAP = {
  'wcag111': 'WCAG 1.1.1 Non-text Content',
  'wcag122': 'WCAG 1.2.2 Captions (Prerecorded)',
  'wcag131': 'WCAG 1.3.1 Info and Relationships',
  'wcag132': 'WCAG 1.3.2 Meaningful Sequence',
  'wcag141': 'WCAG 1.4.1 Use of Color',
  'wcag143': 'WCAG 1.4.3 Contrast (Minimum)',
  'wcag144': 'WCAG 1.4.4 Resize Text',
  'wcag146': 'WCAG 1.4.6 Contrast (Enhanced)',
  'wcag1411': 'WCAG 1.4.11 Non-text Contrast',
  'wcag211': 'WCAG 2.1.1 Keyboard Accessible',
  'wcag212': 'WCAG 2.1.2 No Keyboard Trap',
  'wcag222': 'WCAG 2.2.2 Pause, Stop, Hide',
  'wcag241': 'WCAG 2.4.1 Bypass Blocks',
  'wcag242': 'WCAG 2.4.2 Page Titled',
  'wcag244': 'WCAG 2.4.4 Link Purpose (In Context)',
  'wcag246': 'WCAG 2.4.6 Headings and Labels',
  'wcag247': 'WCAG 2.4.7 Focus Visible',
  'wcag255': 'WCAG 2.5.5 Target Size (Enhanced)',
  'wcag258': 'WCAG 2.5.8 Target Size (Minimum)',
  'wcag311': 'WCAG 3.1.1 Language of Page',
  'wcag312': 'WCAG 3.1.2 Language of Parts',
  'wcag332': 'WCAG 3.3.2 Labels or Instructions',
  'wcag411': 'WCAG 4.1.1 Parsing',
  'wcag412': 'WCAG 4.1.2 Name, Role, Value'
};

export function extractWcagCriterion(tags = [], ruleId = '') {
  if (ruleId === 'heading-order') return 'WCAG 1.3.1 Info and Relationships';
  if (ruleId === 'landmark-one-main') return 'WCAG 1.3.1 / 2.4.1 Landmark Hierarchy';
  if (ruleId === 'region') return 'WCAG 1.3.1 / 2.4.1 Landmark Regions';
  if (ruleId === 'table-missing-headers') return 'WCAG 1.3.1 Info and Relationships';
  if (ruleId === 'moving-content-no-pause') return 'WCAG 2.2.2 Pause, Stop, Hide';
  if (ruleId === 'target-size') return 'WCAG 2.5.8 Target Size (Minimum)';
  if (ruleId === 'video-caption') return 'WCAG 1.2.2 Captions (Prerecorded)';

  for (const tag of tags) {
    if (WCAG_TAG_MAP[tag]) return WCAG_TAG_MAP[tag];
    const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
    if (match) return `WCAG ${match[1]}.${match[2]}.${match[3]}`;
  }
  return 'WCAG 2.1 / 2.2 Best Practice';
}

export function getWcagPrinciple(tags = [], ruleId = '') {
  if (['heading-order', 'landmark-one-main', 'region', 'table-missing-headers', 'color-contrast', 'color-contrast-enhanced', 'image-alt', 'video-caption'].includes(ruleId)) {
    return 'Perceivable';
  }
  if (['button-name', 'link-name', 'target-size', 'moving-content-no-pause', 'tabindex'].includes(ruleId)) {
    return 'Operable';
  }

  for (const tag of tags) {
    if (tag.startsWith('wcag1')) return 'Perceivable';
    if (tag.startsWith('wcag2')) return 'Operable';
    if (tag.startsWith('wcag3')) return 'Understandable';
    if (tag.startsWith('wcag4')) return 'Robust';
  }

  const perceivableRules = ['color-contrast', 'image-alt', 'audio-caption', 'video-caption'];
  const operableRules = ['button-name', 'link-name', 'target-size', 'tabindex', 'focus-order-semantics'];
  const understandableRules = ['html-has-lang', 'valid-lang', 'label'];
  const robustRules = ['aria-valid-attr', 'aria-roles', 'aria-allowed-attr'];

  if (perceivableRules.some(r => ruleId.includes(r))) return 'Perceivable';
  if (operableRules.some(r => ruleId.includes(r))) return 'Operable';
  if (understandableRules.some(r => ruleId.includes(r))) return 'Understandable';
  if (robustRules.some(r => ruleId.includes(r))) return 'Robust';

  return 'Perceivable';
}

export function normalizeViolations(axeViolations = [], domLocators = new Map()) {
  return axeViolations.map(v => {
    const wcagCriterion = extractWcagCriterion(v.tags, v.id);
    const principle = getWcagPrinciple(v.tags, v.id);

    const nodes = v.nodes.map(node => {
      const selector = Array.isArray(node.target) ? node.target.join(' ') : String(node.target);
      let dataLoc = domLocators.get(selector) || null;

      if (!dataLoc && node.html) {
        const match = node.html.match(/data-loc=["']([^"']+)["']/);
        if (match) dataLoc = match[1];
      }

      return {
        target: node.target,
        selector,
        html: node.html,
        impact: node.impact || v.impact || 'minor',
        failureSummary: node.failureSummary,
        dataLoc: dataLoc || null,
        all: node.all || [],
        any: node.any || [],
        none: node.none || []
      };
    });

    return {
      id: v.id,
      rule: v.id,
      wcagCriterion,
      principle,
      impact: v.impact || 'minor',
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      tags: v.tags,
      nodes
    };
  });
}
