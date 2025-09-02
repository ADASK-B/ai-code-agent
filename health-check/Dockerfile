FROM node:20-alpine

WORKDIR /app

# Health Check Dependencies
RUN apk add --no-cache curl docker-cli

# Create health check script
COPY health-check.js .
COPY package.json .

RUN npm install --only=production

# Health Check Command
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node health-check.js

# Default command
CMD ["node", "health-check.js", "--watch"]

EXPOSE 8888
