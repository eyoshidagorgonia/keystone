# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy configuration files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.server.json ./
COPY tailwind.config.ts ./
COPY next.config.ts ./
COPY components.json ./

# Install ALL dependencies (including devDependencies for the build)
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js app and the server
RUN npm run build

# Prune development dependencies for the final image
RUN npm prune --omit=dev


# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Set build-time argument for KEYSTONE_MODE
ARG KEYSTONE_MODE=admin
ENV KEYSTONE_MODE=${KEYSTONE_MODE}

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy the pruned node_modules from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
# Copy built server assets
COPY --from=builder /usr/src/app/dist ./dist
# Copy built Next.js assets
COPY --from=builder --chown=appuser:appgroup /usr/src/app/.next ./.next
# Copy public assets and package.json
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package.json ./package.json

# The actual port will be mapped in docker-compose.yml
EXPOSE 9002
EXPOSE 9003

CMD ["node", "dist/server.js"]
