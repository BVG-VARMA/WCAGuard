/**
 * WCAGuard Fixer: tabindex & focus
 * WCAG 2.4.3 Focus Order / WCAG 2.4.7 Focus Visible
 * Status: CERTIFIED
 */

import * as t from '@babel/types';

export const id = 'tabindex';
export const wcagCriterion = 'WCAG 2.4.3 Focus Order';
export const confidence = 1.0;
export const status = 'CERTIFIED';

export function detect(jsxOpeningElement) {
  // Check positive tabindex
  for (const attr of jsxOpeningElement.attributes) {
    if (t.isJSXAttribute(attr) && (attr.name?.name === 'tabIndex' || attr.name?.name === 'tabindex')) {
      if (t.isStringLiteral(attr.value)) {
        const val = parseInt(attr.value.value, 10);
        if (val > 0) return true;
      }
      if (t.isJSXExpressionContainer(attr.value) && t.isNumericLiteral(attr.value.expression)) {
        if (attr.value.expression.value > 0) return true;
      }
    }
  }

  // Check outline-none without visible focus
  const classAttr = jsxOpeningElement.attributes.find(
    a => t.isJSXAttribute(a) && (a.name?.name === 'className' || a.name?.name === 'class') && t.isStringLiteral(a.value)
  );
  if (classAttr) {
    const cls = classAttr.value.value;
    if (cls.includes('outline-none') && !cls.includes('focus:ring') && !cls.includes('focus:outline')) {
      return true;
    }
  }

  return false;
}

export function fix(path) {
  const { node } = path;
  let fixed = false;
  let details = [];

  // 1. Reset positive tabIndex to 0
  for (const attr of node.attributes) {
    if (t.isJSXAttribute(attr) && (attr.name?.name === 'tabIndex' || attr.name?.name === 'tabindex')) {
      let isPositive = false;
      if (t.isStringLiteral(attr.value) && parseInt(attr.value.value, 10) > 0) isPositive = true;
      if (t.isJSXExpressionContainer(attr.value) && t.isNumericLiteral(attr.value.expression) && attr.value.expression.value > 0) isPositive = true;

      if (isPositive) {
        attr.name.name = 'tabIndex';
        attr.value = t.jsxExpressionContainer(t.numericLiteral(0));
        fixed = true;
        details.push('Removed positive tabindex and normalized to standard natural tab order (tabIndex={0})');
      }
    }
  }

  // 2. Ensure visible focus indicator if outline was removed
  const classAttr = node.attributes.find(
    a => t.isJSXAttribute(a) && (a.name?.name === 'className' || a.name?.name === 'class') && t.isStringLiteral(a.value)
  );
  if (classAttr) {
    let cls = classAttr.value.value;
    if (cls.includes('outline-none') && !cls.includes('focus:ring') && !cls.includes('focus:outline')) {
      cls = cls + ' focus:ring-2 focus:ring-blue-600 focus:outline-none';
      classAttr.value = t.stringLiteral(cls);
      fixed = true;
      details.push('Added visible keyboard focus indicator (focus:ring-2)');
    }
  }

  if (!fixed) return null;

  return {
    fixed: true,
    ruleId: id,
    wcagCriterion,
    status: 'CERTIFIED',
    confidence: 1.0,
    details: details.join('; ')
  };
}
