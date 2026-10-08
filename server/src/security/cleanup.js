import fs from 'fs';
import path from 'path';

/**
 * Safely removes a file or directory recursively.
 */
export function cleanupPath(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }
    }
  } catch (err) {
    console.warn(`[Cleanup] Failed to clean ${targetPath}: ${err.message}`);
  }
}
