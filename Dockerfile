# Monolith: Vite frontend + Express API. Build from repo root 

# --- Stage 1: build the SPA (Vite) ---
# Produces static HTML/JS/CSS under dist/ — copied into the final image as ./public.
FROM node:22-bookworm-slim AS client-build
WORKDIR /app/client
COPY client/ ./

# Empty = browser calls /api on the same host as the page (same domain as Express).
ENV VITE_API_URL=

# Public Clerk key (safe to pass as build-arg; it is embedded in client JS anyway)
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Install pnpm globally using npm
RUN npm install -g pnpm
RUN pnpm install --no-audit --no-fund \
  && pnpm run build

  # --- Stage 2: compile the API (TypeScript → JavaScript) ---
# Produces dist/ with index.js and the rest of the server bundle.
FROM node:22-bookworm-slim AS server-build
WORKDIR /app
COPY server/ ./

# Install pnpm globally using npm
RUN npm install -g pnpm
RUN pnpm install --no-audit --no-fund \
  && pnpm run build

# --- Stage 3: runtime image (only prod deps + built assets) ---
# Express serves API routes and static files from public/ (the Vite build from stage 1).
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY server/pnpm-lock.yaml ./

# Install pnpm globally using npm
RUN npm install -g pnpm
RUN pnpm install --omit=dev --no-audit --no-fund && pnpm cache clean --force

COPY --from=server-build /app/dist ./dist
COPY --from=client-build /app/client/dist ./public

EXPOSE 5000
USER node

CMD ["node", "dist/index.js"]