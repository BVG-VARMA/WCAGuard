import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_DIRS = [
  path.join(ROOT_DIR, 'data/scans'),
  path.join(ROOT_DIR, 'data/reports'),
  path.join(ROOT_DIR, 'data/certificates'),
  path.join(ROOT_DIR, 'data/tmp')
];

let totalDeleted = 0;

for (const dir of DATA_DIRS) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    continue;
  }

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (entry === '.gitkeep') continue;
    const fullPath = path.join(dir, entry);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      totalDeleted++;
    } catch (err) {
      console.error(`Failed to remove ${fullPath}:`, err.message);
    }
  }

  // Ensure .gitkeep exists so empty directories are preserved in Git
  const gitkeepPath = path.join(dir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '# Keep this directory in git\n', 'utf8');
  }
}

console.log(`✓ Successfully purged ${totalDeleted} stored demo files/directories from data/`);
