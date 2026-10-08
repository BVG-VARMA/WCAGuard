/**
 * WCAGuard Violation Localizer
 * Maps axe-core violation nodes to DOM selectors, HTML snippets, and data-loc JSX line numbers.
 */

export function localizeViolations(violations = []) {
  return violations.map(v => {
    const nodes = (v.nodes || []).map(node => {
      const html = node.html || '';
      // Extract data-loc attribute if stamped by babel-plugin-data-loc
      const match = html.match(/data-loc=["']([^"']+)["']/);
      const dataLoc = match ? match[1] : null;

      let file = null;
      let line = null;
      if (dataLoc) {
        const parts = dataLoc.split(':');
        file = parts[0] || null;
        line = parts[1] ? parseInt(parts[1], 10) : null;
      }

      return {
        target: node.target || [],
        html,
        failureSummary: node.failureSummary || '',
        dataLoc,
        file,
        line,
        any: node.any || [],
        all: node.all || [],
        none: node.none || []
      };
    });

    const firstNode = nodes[0] || null;

    return {
      ...v,
      nodes,
      primaryLocation: {
        selector: firstNode?.target?.join(' ') || 'unknown',
        file: firstNode?.file || null,
        line: firstNode?.line || null,
        dataLoc: firstNode?.dataLoc || null,
        snippet: firstNode?.html || ''
      }
    };
  });
}
