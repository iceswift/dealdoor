# DealDoor - Production Dockerfile

# Stage 1: Build
FROM oven/bun:1.3.14-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Stage 2: Production
FROM oven/bun:1.3.14-alpine AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Create non-root user
RUN addgroup --system --gid 1001 astro
RUN adduser --system --uid 1001 astro

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/db ./db
COPY --from=builder /app/public ./public

# Create necessary directories
RUN mkdir -p /app/db /app/public/uploads/covers /app/public/uploads/logos /app/public/uploads/deals /app/public/uploads/menu

# Set permissions
RUN chown -R astro:astro /app

# Switch to non-root user
USER astro

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4321/api/health || exit 1

# Start the application
CMD ["bun", "dist/server/entry.mjs"]
