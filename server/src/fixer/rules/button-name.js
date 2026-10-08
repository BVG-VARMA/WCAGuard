import * as t from '@babel/types';

export const id = 'button-name';
export const wcagCriterion = 'WCAG 4.1.2 Name, Role, Value';
export const confidence = 0.85;
export const status = 'NEEDS_REVIEW';

export function detect(jsxOpeningElement, parentElement) {
  const tagName = jsxOpeningElement.name?.name;
  if (tagName !== 'button') return false;

  const hasAriaLabel = jsxOpeningElement.attributes.some(
    a => t.isJSXAttribute(a) && (a.name?.name === 'aria-label' || a.name?.name === 'aria-labelledby')
  );
  if (hasAriaLabel) return false;

  if (parentElement && t.isJSXElement(parentElement)) {
    const textChildren = parentElement.children.filter(
      c => t.isJSXText(c) && c.value.trim().length > 0
    );
    if (textChildren.length > 0) return false;
  }

  return true;
}

function guessButtonName(jsxOpeningElement, parentElement) {
  const titleAttr = jsxOpeningElement.attributes.find(
    a => t.isJSXAttribute(a) && a.name?.name === 'title' && t.isStringLiteral(a.value)
  );
  if (titleAttr && titleAttr.value.value.trim()) {
    return { name: titleAttr.value.value.trim(), isExact: true };
  }

  if (parentElement && t.isJSXElement(parentElement)) {
    for (const child of parentElement.children) {
      if (t.isJSXElement(child)) {
        const iconTag = child.openingElement?.name?.name || '';
        const match = iconTag.match(/^(?:Fa|Fi|Ai|Md|Hi|Io|Bi|Lucide)?([A-Z][a-zA-Z]+?)(?:Icon)?$/);
        if (match && match[1]) {
          const readable = match[1].replace(/([A-Z])/g, ' $1').trim();
          return { name: readable, isExact: false };
        }
      }
    }
  }

  const classAttr = jsxOpeningElement.attributes.find(
    a => t.isJSXAttribute(a) && (a.name?.name === 'className' || a.name?.name === 'class') && t.isStringLiteral(a.value)
  );
  if (classAttr) {
    const cls = classAttr.value.value.toLowerCase();
    if (cls.includes('close')) return { name: 'Close', isExact: false };
    if (cls.includes('delete') || cls.includes('trash')) return { name: 'Delete', isExact: false };
    if (cls.includes('search')) return { name: 'Search', isExact: false };
    if (cls.includes('menu')) return { name: 'Menu', isExact: false };
    if (cls.includes('settings')) return { name: 'Settings', isExact: false };
  }

  return { name: 'Action', isExact: false };
}

export function fix(path, options = {}) {
  const { node } = path;
  const parent = path.parent;
  if (!detect(node, parent)) return null;

  const guess = guessButtonName(node, parent);
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
    status: guess.isExact ? 'CERTIFIED' : 'NEEDS_REVIEW',
    confidence: guess.isExact ? 0.98 : 0.8,
    details: `Added aria-label="${finalName}" to button without accessible text.`
  };
}
