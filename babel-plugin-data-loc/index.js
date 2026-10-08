import path from 'path';

/**
 * Babel plugin to inject data-loc attribute into JSX Opening Elements.
 * Stamps every JSX tag with: data-loc="filename:line"
 */
export default function babelPluginDataLoc({ types: t }) {
  return {
    name: 'babel-plugin-data-loc',
    visitor: {
      JSXOpeningElement(jsxPath, state) {
        // Skip elements that already have data-loc
        const hasDataLoc = jsxPath.node.attributes.some(
          attr => t.isJSXAttribute(attr) && attr.name && attr.name.name === 'data-loc'
        );
        if (hasDataLoc) return;

        const loc = jsxPath.node.loc;
        if (!loc) return;

        const rawFilename = state.file?.opts?.filename || state.filename || 'Component.jsx';
        const displayFilename = path.basename(rawFilename);
        const locString = `${displayFilename}:${loc.start.line}`;

        const dataLocAttr = t.jsxAttribute(
          t.jsxIdentifier('data-loc'),
          t.stringLiteral(locString)
        );

        jsxPath.node.attributes.push(dataLocAttr);
      }
    }
  };
}
