/**
 * WCAGuard Fixer: target-size
 * WCAG 2.5.8 Target Size (Minimum) [WCAG 2.2 Level AA]
 * Status: CERTIFIED
 */

import * as t from '@babel/types';

export const id = 'target-size';
export const wcagCriterion = 'WCAG 2.5.8 Target Size (Minimum)';
export const confidence = 1.0;
export const status = 'CERTIFIED';

export function detect(jsxOpeningElement) {
  const tagName = jsxOpeningElement.name?.name;
  if (tagName !== 'button' && tagName !== 'a') return false;

  const classAttr = jsxOpeningElement.attributes.find(
    a => t.isJSXAttribute(a) && (a.name?.name === 'className' || a.name?.name === 'class') && t.isStringLiteral(a.value)
  );
  if (!classAttr) return false;

  const classes = classAttr.value.value.split(/\s+/);
  // Detect undersized dimensions (e.g. w-3, h-3, w-4, h-4, p-0.5)
  const tinySizes = ['w-3', 'h-3', 'w-4', 'h-4', 'w-5', 'h-5', 'p-0', 'p-0.5', 'text-xs'];
  return classes.some(c => tinySizes.includes(c));
}

export function fix(path) {
  const { node } = path;
  if (!detect(node)) return null;

  const classAttr = node.attributes.find(
    a => t.isJSXAttribute(a) && (a.name?.name === 'className' || a.name?.name === 'class') && t.isStringLiteral(a.value)
  );

  let classes = classAttr.value.value.split(/\s+/);
  // Remove tiny dimensions
  classes = classes.filter(c => !['w-3', 'h-3', 'w-4', 'h-4', 'w-5', 'h-5'].includes(c));
  
  // Ensure minimum 24x24 px (min-w-[24px] min-h-[24px] p-1.5 or inline style)
  if (!classes.includes('min-w-[24px]')) classes.push('min-w-[24px]');
  if (!classes.includes('min-h-[24px]')) classes.push('min-h-[24px]');
  if (!classes.some(c => c.startsWith('p-') || c.startsWith('px-') || c.startsWith('py-'))) {
    classes.push('p-1.5');
  }

  classAttr.value = t.stringLiteral(classes.join(' '));

  return {
    fixed: true,
    ruleId: id,
    wcagCriterion,
    status: 'CERTIFIED',
    confidence: 1.0,
    details: 'Enlarged interactive target size to at least 24x24 CSS pixels per WCAG 2.2 SC 2.5.8.'
  };
}
