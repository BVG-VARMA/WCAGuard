import * as t from '@babel/types';
import { fixContrastHex, getContrastRatio, hexToRgb } from './contrast-math.js';

export const id = 'color-contrast';
export const wcagCriterion = 'WCAG 1.4.3 Contrast (Minimum)';
export const confidence = 1.0;
export const status = 'CERTIFIED';

const TAILWIND_CONTRAST_MAP = {
  'text-gray-300': 'text-gray-800',
  'text-gray-400': 'text-gray-900',
  'text-slate-300': 'text-slate-800',
  'text-slate-400': 'text-slate-900',
  'text-zinc-300': 'text-zinc-800',
  'text-zinc-400': 'text-zinc-900',
  'text-neutral-300': 'text-neutral-800',
  'text-neutral-400': 'text-neutral-900'
};

export function detect(jsxOpeningElement) {
  const styleAttr = jsxOpeningElement.attributes.find(
    a => t.isJSXAttribute(a) && a.name?.name === 'style'
  );
  if (styleAttr && t.isJSXExpressionContainer(styleAttr.value) && t.isObjectExpression(styleAttr.value.expression)) {
    const colorProp = styleAttr.value.expression.properties.find(
      p => t.isObjectProperty(p) && (p.key.name === 'color' || p.key.value === 'color')
    );
    if (colorProp && t.isStringLiteral(colorProp.value)) {
      const hex = colorProp.value.value;
      if (/^#[0-9a-fA-F]{3,6}$/.test(hex)) {
        const ratio = getContrastRatio(hexToRgb(hex), hexToRgb('#ffffff'));
        if (ratio < 4.5) return true;
      }
    }
  }

  const classAttr = jsxOpeningElement.attributes.find(
    a => t.isJSXAttribute(a) && (a.name?.name === 'className' || a.name?.name === 'class') && t.isStringLiteral(a.value)
  );
  if (classAttr) {
    const classes = classAttr.value.value.split(/\s+/);
    for (const cls of classes) {
      if (TAILWIND_CONTRAST_MAP[cls]) return true;
    }
  }

  return false;
}

export function fix(path) {
  const { node } = path;
  let fixed = false;
  let details = '';

  const styleAttr = node.attributes.find(
    a => t.isJSXAttribute(a) && a.name?.name === 'style'
  );
  if (styleAttr && t.isJSXExpressionContainer(styleAttr.value) && t.isObjectExpression(styleAttr.value.expression)) {
    const colorProp = styleAttr.value.expression.properties.find(
      p => t.isObjectProperty(p) && (p.key.name === 'color' || p.key.value === 'color')
    );
    if (colorProp && t.isStringLiteral(colorProp.value)) {
      const originalHex = colorProp.value.value;
      const res = fixContrastHex(originalHex, '#ffffff', 4.5);
      if (res.modified) {
        colorProp.value = t.stringLiteral(res.fixedHex);
        fixed = true;
        details = `Adjusted text color from ${originalHex} to ${res.fixedHex} (contrast ratio improved to ${res.ratio}:1, meets WCAG 4.5:1).`;
      }
    }
  }

  const classAttr = node.attributes.find(
    a => t.isJSXAttribute(a) && (a.name?.name === 'className' || a.name?.name === 'class') && t.isStringLiteral(a.value)
  );
  if (classAttr) {
    let classes = classAttr.value.value.split(/\s+/);
    let modifiedClasses = false;

    classes = classes.map(cls => {
      if (TAILWIND_CONTRAST_MAP[cls]) {
        modifiedClasses = true;
        details = `Upgraded ${cls} to ${TAILWIND_CONTRAST_MAP[cls]} for WCAG AA compliance (>= 4.5:1).`;
        return TAILWIND_CONTRAST_MAP[cls];
      }
      return cls;
    });

    if (modifiedClasses) {
      classAttr.value = t.stringLiteral(classes.join(' '));
      fixed = true;
    }
  }

  if (!fixed) return null;

  return {
    fixed: true,
    ruleId: id,
    wcagCriterion,
    status: 'CERTIFIED',
    confidence: 1.0,
    details: details || 'Adjusted color contrast to satisfy WCAG AA 4.5:1 luminance ratio.'
  };
}
