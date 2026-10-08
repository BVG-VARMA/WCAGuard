import * as t from '@babel/types';

export const id = 'html-has-lang';
export const wcagCriterion = 'WCAG 3.1.1 Language of Page';
export const confidence = 1.0;
export const status = 'CERTIFIED';

export function detect(jsxOpeningElement) {
  const tagName = jsxOpeningElement.name?.name;
  if (tagName !== 'html') return false;

  const hasLang = jsxOpeningElement.attributes.some(
    a => t.isJSXAttribute(a) && a.name?.name === 'lang'
  );
  return !hasLang;
}

export function fix(path) {
  const { node } = path;
  if (!detect(node)) return null;

  const langAttr = t.jsxAttribute(
    t.jsxIdentifier('lang'),
    t.stringLiteral('en')
  );

  node.attributes.push(langAttr);

  return {
    fixed: true,
    ruleId: id,
    wcagCriterion,
    status: 'CERTIFIED',
    confidence: 1.0,
    details: 'Added lang="en" to root <html> element.'
  };
}

export function fixHtmlString(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') return htmlContent;

  if (/<html\s+[^>]*lang=["'][^"']+["']/i.test(htmlContent)) {
    return { content: htmlContent, fixed: false };
  }

  let fixedContent = htmlContent.replace(/<html(\s*|>)/i, '<html lang="en"$1');
  return {
    content: fixedContent,
    fixed: fixedContent !== htmlContent,
    ruleId: id,
    wcagCriterion,
    status: 'CERTIFIED',
    confidence: 1.0,
    details: 'Added lang="en" to <html> in index.html.'
  };
}
