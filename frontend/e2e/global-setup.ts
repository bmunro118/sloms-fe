import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { FullConfig } from '@playwright/test';
import { provisionUser } from './fixtures/provision';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Provisions a baseline user once per run and writes it to .tmp so specs can
// share it via readProvisionedUser(). Specs that need their own isolated user
// can call provisionUser() directly instead.

export const PROVISIONED_USER_FILE = path.join(dirname, '.tmp', 'e2e-user.json');

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const user = await provisionUser('Operative');

  fs.mkdirSync(path.dirname(PROVISIONED_USER_FILE), { recursive: true });
  fs.writeFileSync(PROVISIONED_USER_FILE, JSON.stringify(user, null, 2), 'utf8');

  console.log(`[e2e] Provisioned baseline user "${user.username}".`);
}
