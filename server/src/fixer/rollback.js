import fs from 'fs';
import { logger } from '../utils/logger.js';

/**
 * Automatically restores a directory from a backup snapshot.
 */
export function restoreBackup(backupDir, targetDir) {
  logger.warn(`Restoring backup from ${backupDir} to ${targetDir}`);
  if (fs.existsSync(backupDir)) {
    fs.cpSync(backupDir, targetDir, { recursive: true, force: true });
    return true;
  }
  return false;
}
