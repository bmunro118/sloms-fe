# CI/CD setup (frontend)

Branch-driven environments with a build-once / promote-the-artifact model — the
same pattern as the backend (`sloms-be`).

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `ci.yml` | PRs + pushes to any branch except `main` | lint, unit tests (vitest), static web export (`expo export -p web`) |
| `deploy-dev.yml` | push to `integration` (or manual) | builds the image, pushes `:<sha>` + `:latest` to ACR, deploys to **stage** (`slomsweb-stage` / rg `sloms-stage`) |
| `deploy-prod.yml` | push to `main` (or manual) | **no rebuild** — promotes the image stage is currently running to **prod** (`slomsweb-prod` / rg `sloms-prod`) |
| `e2e-tests.yml` | manual (`workflow_dispatch`) | full-stack Playwright suite — boots backend (Postgres + seed) + Expo web, runs browser tests |

Flow: feature branch → PR → **`integration`** (auto-deploys to stage) → validate →
merge **`integration` → `main`** (promotes the validated image to prod). A manual
`deploy-prod` run can override the image via the `image` input.

Lint, unit tests, and the web export also run *inside* `frontend/Dockerfile`, so
stage can't deploy an image whose lint/tests fail; prod only ever runs an image that
already passed through stage.

## Image

`frontend/Dockerfile` is a two-stage build:

1. **builder** (`node:20-slim`) — `npm ci`, `npm run lint`, `npm test`, then
   `expo export -p web` → static SPA in `dist/`.
2. **production** (`nginx:1.27-alpine`) — serves `dist/` with an SPA fallback
   (`nginx.conf`). No Node or Metro at runtime; image is small and fast.

`frontend/Dockerfile.dev` is the old live Metro dev-server image, kept for local
containerized development only — it is not deployed.

### API URL is supplied at runtime (per environment)

Expo inlines `EXPO_PUBLIC_*` vars at export time, so a baked API URL would be the
same in every environment — incompatible with build-once / promote. Instead the
API URL is injected **at container startup**:

- `frontend/docker-entrypoint.d/40-sloms-runtime-config.sh` reads the
  `API_BASE_URL` env var and writes `/runtime-config.js`
  (`window.__SLOMS_RUNTIME_CONFIG__ = { apiBaseUrl: … }`), then injects a
  `<script>` for it into `index.html` before nginx starts.
- `frontend/utils/config.ts` reads that global first (highest priority), falling
  back to the baked `EXPO_PUBLIC_*` defaults when it's absent (e.g. native builds).

So the **same promoted image** points at the right backend per environment via the
Container App's `API_BASE_URL`:

| | `API_BASE_URL` |
| --- | --- |
| stage (`slomsweb-stage`) | `https://slomsapi-stage.jollydune-b8782950.uksouth.azurecontainerapps.io` |
| prod (`slomsweb-prod`) | `https://slomsapi-prod.victoriousrock-fbe37a7c.uksouth.azurecontainerapps.io` |

These are already set on both Container Apps. `/runtime-config.js` is served
`no-store` so a restart always picks up the current value.

### Feature flags

Page-level access gates (`documentsPage`, `priceListPage`, `vatRatesPage`) default
**off** in the app and are enabled in the deployed build via Dockerfile build args
(`EXPO_PUBLIC_FEATURE_*_PAGE`, default `true`) — kept in sync with the `ci.yml`
export step and the unit tests. Override the build args to ship a leaner image.
Unlike the API URL these are **baked**, so they're identical in dev and prod.

## Environments & OIDC

GitHub authenticates to Azure with short-lived OIDC tokens (no stored credential),
federated on **GitHub Environments**. Each deploy job declares `environment: stage` /
`environment: prod`; the OIDC subject is `repo:Sonic-Labs-Ltd/sloms-fe:environment:<env>`.

Provisioned for this repo (separate from the backend's app registration):

- App registration **`sloms-fe-github-actions`** (clientId `133b34bf-5762-4906-b1e7-eb2bc72d0149`),
  federated creds for `environment:stage` and `environment:prod`.
- Roles: `AcrPush` on the shared registry `slomsacregistry2026`; `Contributor` on
  both `sloms-stage` and `sloms-prod`.
- Repo secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.
- GitHub Environments `stage` and `prod` (add required reviewers on `prod` if you
  want manual approval before prod promotes).

## Topology

| | stage | prod |
| --- | --- | --- |
| Resource group | `sloms-stage` | `sloms-prod` |
| Container App | `slomsweb-stage` | `slomsweb-prod` |
| Container App env | `sloms-stage-env` (shared with API) | `sloms-prod-env` (shared) |
| Registry | `slomsacregistry2026` (shared, in rg `sloms`) | ← same |

URLs:
- stage: https://slomsweb-stage.jollydune-b8782950.uksouth.azurecontainerapps.io
- prod: https://slomsweb-prod.victoriousrock-fbe37a7c.uksouth.azurecontainerapps.io

Each Container App pulls the image from ACR via its own system-assigned managed
identity (`AcrPull`) — no stored registry password.

## Recommended

- Protect `main` (require PRs / passing CI) so prod only updates via an
  `integration → main` merge.
- The `integration` branch drives dev deploys; keep it as the integration target.
- To enable `e2e-tests.yml`: add a `REPO_PAT` secret (a PAT with `repo` scope that
  can read `sloms-be` and `sonic_dev_tools`) and the `SONIC_*_USER/PASS` login
  secrets. Then run it from the Actions tab, or add `pull_request`/`push` triggers.
