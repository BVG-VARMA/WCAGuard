import * as t from '@babel/types';

export const id = 'image-alt';
export const wcagCriterion = 'WCAG 1.1.1 Non-text Content';
export const confidence = 0.85;
export const status = 'NEEDS_REVIEW';

export function detect(jsxOpeningElement) {
  const tagName = jsxOpeningElement.name?.name;
  if (tagName !== 'img' && tagName !== 'Image') return false;

  const altAttr = jsxOpeningElement.attributes.find(
    attr => t.isJSXAttribute(attr) && attr.name?.name === 'alt'
  );
  if (!altAttr) return true; // Missing alt attribute -> violation

  // If alt attribute is present, check whether it has a non-empty description
  if (t.isStringLiteral(altAttr.value)) {
    return altAttr.value.value.trim().length === 0; // Empty description -> violation
  }
  if (t.isJSXExpressionContainer(altAttr.value)) {
    if (t.isStringLiteral(altAttr.value.expression)) {
      return altAttr.value.expression.value.trim().length === 0;
    }
  }

  return false;
}

function inferAltText(jsxOpeningElement) {
  let srcVal = '';

  for (const attr of jsxOpeningElement.attributes) {
    if (t.isJSXAttribute(attr)) {
      if (attr.name?.name === 'src' && t.isStringLiteral(attr.value)) {
        srcVal = attr.value.value;
      }
    }
  }

  if (srcVal) {
    const filename = srcVal.split('/').pop().split('?')[0].replace(/\.[^/.]+$/, '');
    const readable = filename.replace(/[-_]/g, ' ').trim();
    if (readable && readable.length > 2) {
      return { alt: readable.charAt(0).toUpperCase() + readable.slice(1) };
    }
  }

  return { alt: 'Illustration content' };
}

export function fix(path, options = {}) {
  const { node } = path;
  if (!detect(node)) return null;

  const { alt } = inferAltText(node);
  const finalAlt = options.suggestedText !== undefined ? options.suggestedText : alt;

  const existingAlt = node.attributes.find(
    attr => t.isJSXAttribute(attr) && attr.name?.name === 'alt'
  );

  if (existingAlt) {
    existingAlt.value = t.stringLiteral(finalAlt);
  } else {
    const altAttr = t.jsxAttribute(
      t.jsxIdentifier('alt'),
      t.stringLiteral(finalAlt)
    );
    node.attributes.push(altAttr);
  }

  // Remove presentation role or aria-hidden if they were masking the image
  node.attributes = node.attributes.filter(attr => {
    if (t.isJSXAttribute(attr)) {
      const name = attr.name?.name;
      if (name === 'role' && t.isStringLiteral(attr.value) && attr.value.value === 'presentation') return false;
      if (name === 'aria-hidden') return false;
    }
    return true;
  });

  return {
    fixed: true,
    ruleId: id,
    wcagCriterion,
    status: 'NEEDS_REVIEW',
    confidence: 0.85,
    details: `Suggested alt="${finalAlt}". Requires human confirmation per WCAG 1.1.1.`
  };
}
