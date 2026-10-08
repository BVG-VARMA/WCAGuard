/**
 * WCAGuard Locator
 * Maps data-loc strings ("App.jsx:42") back to exact source file and line.
 */

export function parseDataLoc(dataLoc) {
  if (!dataLoc || typeof dataLoc !== 'string') return null;
  const match = dataLoc.match(/^(.+):(\d+)$/);
  if (!match) return null;
  return {
    file: match[1],
    line: parseInt(match[2], 10),
    raw: dataLoc
  };
}

export function mapViolationToSource(node) {
  if (!node) return { file: 'unknown', line: null, selector: '' };

  const parsed = parseDataLoc(node.dataLoc);
  if (parsed) {
    return {
      file: parsed.file,
      line: parsed.line,
      selector: node.selector || '',
      rawLoc: parsed.raw
    };
  }

  return {
    file: 'unknown',
    line: null,
    selector: node.selector || '',
    rawLoc: null
  };
}
