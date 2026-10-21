# DealDoor - Production Dockerfile

# Stage 1: Build
FROM node:22-bookworm-slim AS builder
COPY --from=oven/bun:1.3.14 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build && bun build db/seed.ts --target=node --packages=external --outfile=dist/demo-seed.mjs

# Stage 2: Production
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Create non-root user
RUN groupadd --system --gid 1001 astro && useradd --system --uid 1001 --gid astro astro

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/db ./db
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts

# Create necessary directories
RUN mkdir -p /app/db /app/dist/client/uploads/covers /app/dist/client/uploads/logos /app/dist/client/uploads/deals /app/dist/client/uploads/menu

# Set permissions
RUN chown -R astro:astro /app

# Switch to non-root user
# Railway mounts volumes as root. Other hosts can run with --user 1001:1001.

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4321)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start the application
CMD ["node", "scripts/start-server.mjs"]
