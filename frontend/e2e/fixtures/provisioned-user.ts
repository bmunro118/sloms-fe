import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { ProvisionedUser } from './provision';

export type { ProvisionedUser };

const dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(dirname, '..', '.tmp', 'e2e-user.json');

/** Reads the baseline user written by global-setup.ts (shared across specs). */
export function readProvisionedUser(): ProvisionedUser {
  if (!fs.existsSync(FILE)) {
    throw new Error(
      `Provisioned-user file not found at ${FILE}. Did global setup run? ` +
        'Run via `npm run test:e2e` so global-setup provisions the user first.',
    );
  }
  return JSON.parse(fs.readFileSync(FILE, 'utf8')) as ProvisionedUser;
}
