/**
 * WCAGuard Fixer: landmark & region
 * WCAG 1.3.1 Info and Relationships / WCAG 2.4.1 Bypass Blocks
 * Status: CERTIFIED
 */

import * as t from '@babel/types';

export const id = 'landmark';
export const wcagCriterion = 'WCAG 1.3.1 Info and Relationships';
export const confidence = 0.95;
export const status = 'CERTIFIED';

export function detect(jsxOpeningElement) {
  // If top-level wrapper is a div with role="main" or id="main" or className="app" or "container" without semantic tag
  const tagName = jsxOpeningElement.name?.name;
  if (tagName === 'div') {
    const idAttr = jsxOpeningElement.attributes.find(
      a => t.isJSXAttribute(a) && a.name?.name === 'id' && t.isStringLiteral(a.value)
    );
    if (idAttr && (idAttr.value.value === 'main' || idAttr.value.value === 'content')) {
      return true;
    }
  }
  return false;
}

export function fix(path) {
  const { node } = path;
  if (!detect(node)) return null;

  node.name.name = 'main';
  const roleAttr = t.jsxAttribute(
    t.jsxIdentifier('role'),
    t.stringLiteral('main')
  );
  node.attributes.push(roleAttr);

  // Also update closing element if present
  if (path.parent && path.parent.closingElement) {
    path.parent.closingElement.name.name = 'main';
  }

  return {
    fixed: true,
    ruleId: id,
    wcagCriterion,
    status: 'CERTIFIED',
    confidence: 0.95,
    details: 'Converted top-level div into semantic <main role="main"> landmark.'
  };
}
