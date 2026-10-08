import * as diff from 'diff';

/**
 * Creates a unified diff patch between original and modified code.
 */
export function generateUnifiedDiff(filePath, originalCode, modifiedCode) {
  return diff.createTwoFilesPatch(
    `a/${filePath}`,
    `b/${filePath}`,
    originalCode,
    modifiedCode,
    'original',
    'WCAGuard fix'
  );
}
