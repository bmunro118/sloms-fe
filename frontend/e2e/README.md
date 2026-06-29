# End-to-end tests (Playwright, live backend)

The SLOMS web app's e2e suite. It drives the real UI in a browser against a
live, seeded backend — rather than authenticating via pre-saved `storageState`
(which would skip the login flow). Run locally or in CI via `.github/workflows/e2e.yml`.

## Layout

```
e2e/
  playwright.config.ts     # starts Expo web (local API mode) + runs tests/**
  global-setup.ts          # provisions one shared baseline user per run
  fixtures/
    provision.ts           # provisionUser(), adminToken(), apiPost() helpers
    provisioned-user.ts    # readProvisionedUser() — the shared baseline user
  tests/
    two-factor.spec.ts     # TOTP enroll + second-factor login challenge
```

Every `*.spec.ts` under `tests/` runs automatically — see "Adding a test".

## Prerequisites

- **Backend running** at `http://localhost:3000` (override with `E2E_API_URL`)
  with **`TWOFA_ENFORCE=true`**, `TOTP_ENC_KEY` set, and the standard seed applied
  (`prisma/seed.sql`). The seed provides the `admin` user + a trusted-device token
  that lets setup bootstrap an admin session and create users via the API.
- `otplib` (a devDependency) — computes TOTP codes that match the backend.

Playwright starts the Expo web server automatically in local-API mode.

## Run

```bash
npm run test:e2e          # headless
npm run test:e2e:ui       # Playwright UI mode
```

## Adding a test

1. Drop a `tests/<name>.spec.ts` in — it's picked up automatically.
2. Need a user? Either reuse the shared baseline:

   ```ts
   import { readProvisionedUser } from '../fixtures/provisioned-user';
   const user = readProvisionedUser();
   ```

   …or mint a fresh, isolated one (recommended when a test mutates user state):

   ```ts
   import { provisionUser } from '../fixtures/provision';
   const user = await provisionUser('Manager'); // Admin | Manager | Operative | ReadOnly
   ```

   Both return `{ username, password }` already past the forced first-login
   password change, ready to type into the login screen. New users are not
   2FA-enrolled, so the first login lands on enrollment while `TWOFA_ENFORCE=true`.
3. Anchor selectors on `testID`s (exposed as `data-testid` by react-native-web),
   e.g. `page.getByTestId('login-username')`.

## Notes

- Runs in bearer-token mode (localhost + `EXPO_PUBLIC_API_MODE=local`), so there
  are no cross-origin cookie concerns.
- On web token-mode, "trust this device" is a no-op, so every fresh login
  deterministically triggers the 2FA challenge.
- `.tmp/` (provisioned creds) and `reports/` are git-ignored.
- The email-OTP path isn't covered (it needs mailbox/DB interception); the 2FA
  spec is TOTP-only.
