#!/bin/sh
# Generate runtime config from the container's environment and inject it into the
# static index.html before nginx starts. Runs automatically via nginx:alpine's
# /docker-entrypoint.d/ mechanism.
#
# API_BASE_URL — full origin of the SLOMS API for this environment (e.g. the dev
# or prod backend Container App). If unset/empty, the app falls back to the URL
# baked into utils/config.ts.
set -eu

ROOT=/usr/share/nginx/html
API_BASE_URL="${API_BASE_URL:-}"

cat > "$ROOT/runtime-config.js" <<EOF
window.__SLOMS_RUNTIME_CONFIG__ = { apiBaseUrl: "${API_BASE_URL}" };
EOF

# Load runtime-config.js before the app bundle. Idempotent across restarts.
if ! grep -q 'runtime-config.js' "$ROOT/index.html"; then
  sed -i 's#</head>#<script src="/runtime-config.js"></script></head>#' "$ROOT/index.html"
fi

echo "sloms: runtime config set (API_BASE_URL='${API_BASE_URL}')"
