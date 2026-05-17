# Monolith: Vite frontend + Express API. Build from repo root 

# --- Stage 1: build the SPA (Vite) ---
# Produces static HTML/JS/CSS under dist/ — copied into the final image as ./public.
FROM node:22-bookworm-slim AS client-build
WORKDIR /app/client

# Copy root workspace files first
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
# Copy client-specific package.json
COPY client/package.json ./client/

# Empty = browser calls /api on the same host as the page (same domain as Express).
ENV VITE_API_URL=

# Public Clerk key (safe to pass as build-arg; it is embedded in client JS anyway)
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY


# Use Corepack instead of npm install -g pnpm
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

# Copy source and build
COPY client/ ./
RUN pnpm run build

# --- Stage 2: compile the API (TypeScript → JavaScript) ---
# Produces dist/ with index.js and the rest of the server bundle.
FROM node:22-bookworm-slim AS server-build

WORKDIR /app

# Copy root files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
# Copy server package.json
COPY server/package.json ./server/

# Use Corepack instead of npm install -g pnpm
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

COPY server/ ./
RUN pnpm run build

# --- Stage 3: runtime image (only prod deps + built assets) ---
# Express serves API routes and static files from public/ (the Vite build from stage 1).
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy root lockfile and workspace config
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json ./server/

# Use Corepack instead of npm install -g pnpm
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
RUN pnpm install --prod --filter server --dangerously-allow-all-builds && pnpm store prune


COPY --from=server-build /app/dist ./dist
COPY --from=client-build /app/client/dist ./public

EXPOSE 5000
USER node

CMD ["node", "--env-file=.env", "dist/index.js"]