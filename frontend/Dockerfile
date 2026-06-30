# Production web image for the SLOMS frontend (Expo / React Native Web).
#
# Build stage runs lint + unit tests + a static web export (`expo export -p web`);
# the build FAILS if lint or tests fail, so a broken image can never be pushed.
# The runtime stage is a tiny nginx serving the static SPA — no Node, no Metro.
#
# For local containerized development (live Metro dev server) use Dockerfile.dev.

# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Non-interactive: stop the Expo CLI prompting for input in a container.
ENV CI=1

# API mode baked into the static bundle. EXPO_PUBLIC_* vars are inlined at export
# time, so this is a build-time choice. 'web' → hosted Azure SLOMS API.
# (The concrete API *URL* is supplied at runtime per environment — see
#  docker-entrypoint.d/40-sloms-runtime-config.sh — so the same image works for
#  dev and prod.)
ARG EXPO_PUBLIC_API_MODE=web
ENV EXPO_PUBLIC_API_MODE=${EXPO_PUBLIC_API_MODE}

# Page-level access gates. These default OFF in the app unless their env var is
# set, so enable the core modules in the deployed build. Override per build if
# you need a leaner deployment.
ARG EXPO_PUBLIC_FEATURE_DOCUMENTS_PAGE=true
ARG EXPO_PUBLIC_FEATURE_PRICE_LIST_PAGE=true
ARG EXPO_PUBLIC_FEATURE_VAT_RATES_PAGE=true
# Statistics page: defaults OFF, but the stage deploy builds with =true and that
# value is inlined at export time (see above). Prod CD promotes the byte-identical
# stage :sha with no rebuild, so promoting a stage build also turns the Statistics
# page ON in prod — it is NOT gated off prod. To keep it stage-only this flag must
# become runtime config instead of an EXPO_PUBLIC_* build arg.
ARG EXPO_PUBLIC_FEATURE_STATS_PAGE=false
ENV EXPO_PUBLIC_FEATURE_DOCUMENTS_PAGE=${EXPO_PUBLIC_FEATURE_DOCUMENTS_PAGE} \
    EXPO_PUBLIC_FEATURE_PRICE_LIST_PAGE=${EXPO_PUBLIC_FEATURE_PRICE_LIST_PAGE} \
    EXPO_PUBLIC_FEATURE_VAT_RATES_PAGE=${EXPO_PUBLIC_FEATURE_VAT_RATES_PAGE} \
    EXPO_PUBLIC_FEATURE_STATS_PAGE=${EXPO_PUBLIC_FEATURE_STATS_PAGE}

# Install dependencies first so this layer is cached across source changes.
COPY package*.json ./
RUN npm ci || npm install

# Copy the rest of the app.
COPY . .

# Quality gates — build fails if either fails.
RUN npm run lint
RUN npm test -- --passWithNoTests

# Produce the static web bundle in ./dist.
RUN npx expo export -p web --output-dir dist

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# SPA routing config (try_files fallback to index.html for client-side routes).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Runtime config generator — runs before nginx via the base image's
# /docker-entrypoint.d/ hook. Injects the per-environment API URL at startup.
COPY docker-entrypoint.d/40-sloms-runtime-config.sh /docker-entrypoint.d/40-sloms-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-sloms-runtime-config.sh

# Static export output.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx:alpine's default entrypoint runs /docker-entrypoint.d/*.sh then starts nginx.
