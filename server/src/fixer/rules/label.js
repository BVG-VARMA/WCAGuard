import * as t from '@babel/types';

export const id = 'label';
export const wcagCriterion = 'WCAG 1.3.1 Info and Relationships';
export const confidence = 0.95;
export const status = 'CERTIFIED';

const FORM_TAGS = ['input', 'select', 'textarea'];

export function detect(jsxOpeningElement) {
  const tagName = jsxOpeningElement.name?.name;
  if (!FORM_TAGS.includes(tagName)) return false;

  const typeAttr = jsxOpeningElement.attributes.find(
    a => t.isJSXAttribute(a) && a.name?.name === 'type' && t.isStringLiteral(a.value)
  );
  if (typeAttr && ['hidden', 'submit', 'reset', 'button'].includes(typeAttr.value.value)) {
    return false;
  }

  const hasAriaLabel = jsxOpeningElement.attributes.some(
    a => t.isJSXAttribute(a) && (a.name?.name === 'aria-label' || a.name?.name === 'aria-labelledby')
  );

  return !hasAriaLabel;
}

function extractLabelCandidate(jsxOpeningElement) {
  let placeholder = '';
  let name = '';
  let id = '';
  let type = 'text';

  for (const attr of jsxOpeningElement.attributes) {
    if (t.isJSXAttribute(attr) && t.isStringLiteral(attr.value)) {
      if (attr.name?.name === 'placeholder') placeholder = attr.value.value;
      if (attr.name?.name === 'name') name = attr.value.value;
      if (attr.name?.name === 'id') id = attr.value.value;
      if (attr.name?.name === 'type') type = attr.value.value;
    }
  }

  if (placeholder && placeholder.trim().length > 0) {
    return { text: placeholder.trim(), source: 'placeholder', isExact: true };
  }
  if (name && name.trim().length > 0) {
    const readable = name.replace(/[-_]/g, ' ').replace(/([A-Z])/g, ' $1').trim();
    return { text: readable.charAt(0).toUpperCase() + readable.slice(1), source: 'name', isExact: true };
  }
  if (id && id.trim().length > 0) {
    const readable = id.replace(/[-_]/g, ' ').trim();
    return { text: readable.charAt(0).toUpperCase() + readable.slice(1), source: 'id', isExact: false };
  }

  const typeMap = {
    email: 'Email address',
    password: 'Password',
    search: 'Search input',
    tel: 'Phone number',
    url: 'Website URL',
    text: 'Input field'
  };

  return { text: typeMap[type] || 'Input field', source: 'type', isExact: false };
}

export function fix(path, options = {}) {
  const { node } = path;
  if (!detect(node)) return null;

  const candidate = extractLabelCandidate(node);
  const labelText = options.suggestedText || candidate.text;

  const labelAttr = t.jsxAttribute(
    t.jsxIdentifier('aria-label'),
    t.stringLiteral(labelText)
  );

  node.attributes.push(labelAttr);

  return {
    fixed: true,
    ruleId: id,
    wcagCriterion,
    status: candidate.isExact ? 'CERTIFIED' : 'NEEDS_REVIEW',
    confidence: candidate.isExact ? 0.95 : 0.8,
    details: `Added aria-label="${labelText}" inferred from ${candidate.source}.`
  };
}
