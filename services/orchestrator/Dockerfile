FROM mcr.microsoft.com/azure-functions/node:4-node20 AS builder

WORKDIR /home/site/wwwroot

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY host.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM mcr.microsoft.com/azure-functions/node:4-node20

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

WORKDIR /home/site/wwwroot

# Copy built application and production dependencies
COPY --from=builder /home/site/wwwroot/dist ./dist
COPY --from=builder /home/site/wwwroot/package*.json ./
COPY --from=builder /home/site/wwwroot/host.json ./
RUN npm ci --only=production && npm cache clean --force

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/api/health || exit 1
