FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S gateway -u 1001

# Copy built application and production dependencies
COPY --from=builder --chown=gateway:nodejs /app/dist ./dist
COPY --from=builder --chown=gateway:nodejs /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-8080}/health || exit 1

# Switch to non-root user
USER gateway

EXPOSE 8080

CMD ["node", "dist/index.js"]
