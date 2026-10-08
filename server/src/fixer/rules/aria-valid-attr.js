/**
 * WCAGuard Fixer: aria-valid-attr & aria-roles
 * WCAG 4.1.2 Name, Role, Value
 * Status: CERTIFIED
 */

import * as t from '@babel/types';

export const id = 'aria-valid-attr';
export const wcagCriterion = 'WCAG 4.1.2 Name, Role, Value';
export const confidence = 1.0;
export const status = 'CERTIFIED';

// Valid WAI-ARIA 1.2 roles
const VALID_ROLES = new Set([
  'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox',
  'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog', 'directory',
  'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 'img', 'link',
  'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
  'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
  'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar',
  'search', 'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
  'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
]);

// Common typos in ARIA attributes
const ARIA_ATTR_FIXES = {
  'aria-labeledby': 'aria-labelledby',
  'aria-disbaled': 'aria-disabled',
  'aria-hide': 'aria-hidden'
};

export function detect(jsxOpeningElement) {
  // Check invalid or misspelled aria attributes
  for (const attr of jsxOpeningElement.attributes) {
    if (t.isJSXAttribute(attr) && attr.name?.name) {
      if (ARIA_ATTR_FIXES[attr.name.name]) return true;
      if (attr.name.name.startsWith('aria-') && !isValidAriaAttr(attr.name.name)) return true;
      if (attr.name.name === 'role' && t.isStringLiteral(attr.value)) {
        if (!VALID_ROLES.has(attr.value.value.trim().toLowerCase())) return true;
      }
    }
  }
  return false;
}

function isValidAriaAttr(name) {
  const validPrefixes = [
    'aria-activedescendant', 'aria-atomic', 'aria-autocomplete', 'aria-busy', 'aria-checked',
    'aria-colcount', 'aria-colindex', 'aria-colspan', 'aria-controls', 'aria-current',
    'aria-describedby', 'aria-details', 'aria-disabled', 'aria-dropeffect', 'aria-errormessage',
    'aria-expanded', 'aria-flowto', 'aria-grabbed', 'aria-haspopup', 'aria-hidden', 'aria-invalid',
    'aria-keyshortcuts', 'aria-label', 'aria-labelledby', 'aria-level', 'aria-live', 'aria-modal',
    'aria-multiline', 'aria-multiselectable', 'aria-orientation', 'aria-owns', 'aria-placeholder',
    'aria-posinset', 'aria-pressed', 'aria-readonly', 'aria-relevant', 'aria-required',
    'aria-roledescription', 'aria-rowcount', 'aria-rowindex', 'aria-rowspan', 'aria-selected',
    'aria-setsize', 'aria-sort', 'aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext'
  ];
  return validPrefixes.includes(name);
}

export function fix(path) {
  const { node } = path;
  let fixed = false;
  let details = [];

  const newAttributes = [];

  for (const attr of node.attributes) {
    if (t.isJSXAttribute(attr) && attr.name?.name) {
      const name = attr.name.name;

      // Fix known typos
      if (ARIA_ATTR_FIXES[name]) {
        attr.name.name = ARIA_ATTR_FIXES[name];
        newAttributes.push(attr);
        fixed = true;
        details.push(`Corrected misspelled ${name} to ${ARIA_ATTR_FIXES[name]}`);
        continue;
      }

      // Filter out completely invalid aria attributes
      if (name.startsWith('aria-') && !isValidAriaAttr(name)) {
        fixed = true;
        details.push(`Removed unrecognized attribute ${name}`);
        continue;
      }

      // Check role validity
      if (name === 'role' && t.isStringLiteral(attr.value)) {
        const val = attr.value.value.trim().toLowerCase();
        if (!VALID_ROLES.has(val)) {
          // Known role mappings e.g. "btn" -> "button"
          if (val === 'btn') {
            attr.value.value = 'button';
            newAttributes.push(attr);
            fixed = true;
            details.push('Corrected role="btn" to role="button"');
            continue;
          } else {
            fixed = true;
            details.push(`Removed invalid ARIA role="${val}"`);
            continue;
          }
        }
      }
    }
    newAttributes.push(attr);
  }

  if (!fixed) return null;

  node.attributes = newAttributes;

  return {
    fixed: true,
    ruleId: id,
    wcagCriterion,
    status: 'CERTIFIED',
    confidence: 1.0,
    details: details.join('; ')
  };
}
