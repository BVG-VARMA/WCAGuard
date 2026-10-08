import * as t from '@babel/types';

export const id = 'link-name';
export const wcagCriterion = 'WCAG 2.4.4 Link Purpose (In Context)';
export const confidence = 0.85;
export const status = 'NEEDS_REVIEW';

const GENERIC_LINK_TEXTS = ['click here', 'here', 'more', 'read more', 'learn more', 'link', 'details'];

export function detect(jsxOpeningElement, parentElement) {
  const tagName = jsxOpeningElement.name?.name;
  if (tagName !== 'a' && tagName !== 'Link') return false;

  const hasAriaLabel = jsxOpeningElement.attributes.some(
    a => t.isJSXAttribute(a) && (a.name?.name === 'aria-label' || a.name?.name === 'aria-labelledby')
  );
  if (hasAriaLabel) return false;

  if (parentElement && t.isJSXElement(parentElement)) {
    const textChildren = parentElement.children
      .filter(c => t.isJSXText(c))
      .map(c => c.value.trim().toLowerCase())
      .filter(Boolean);

    if (textChildren.length === 0) return true;
    const text = textChildren.join(' ');
    if (GENERIC_LINK_TEXTS.includes(text)) return true;
  }

  return false;
}

function guessLinkName(jsxOpeningElement) {
  const hrefAttr = jsxOpeningElement.attributes.find(
    a => t.isJSXAttribute(a) && (a.name?.name === 'href' || a.name?.name === 'to') && t.isStringLiteral(a.value)
  );
  if (hrefAttr && hrefAttr.value.value) {
    const segments = hrefAttr.value.value.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last) {
      const readable = last.replace(/[-_#?].*$/, '').replace(/[-_]/g, ' ');
      if (readable) return { name: `Visit ${readable}`, isExact: false };
    }
  }

  return { name: 'Read more details', isExact: false };
}

export function fix(path, options = {}) {
  const { node } = path;
  const parent = path.parent;
  if (!detect(node, parent)) return null;

  const guess = guessLinkName(node);
  const finalName = options.suggestedText || guess.name;

  const ariaLabelAttr = t.jsxAttribute(
    t.jsxIdentifier('aria-label'),
    t.stringLiteral(finalName)
  );

  node.attributes.push(ariaLabelAttr);

  return {
    fixed: true,
    ruleId: id,
    wcagCriterion,
    status: 'NEEDS_REVIEW',
    confidence: 0.82,
    details: `Added aria-label="${finalName}" for generic or empty link.`
  };
}
