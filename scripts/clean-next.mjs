import { rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const root = resolve(process.cwd());
const target = resolve(root, '.next');

if (!target.startsWith(`${root}${sep}`)) throw new Error('Afviser at rydde buildcache uden for projektet.');

for (let attempt = 1; attempt <= 3; attempt += 1) {
  try {
    await rm(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
    console.log('Next.js buildcache er ryddet.');
    break;
  } catch (error) {
    if (attempt === 3) throw error;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 250));
  }
}
