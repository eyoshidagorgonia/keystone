# Stage 1: Installer - Install all dependencies, including dev dependencies
FROM node:20-alpine AS installer
WORKDIR /usr/src/app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy configuration files
COPY package*.json tailwind.config.ts tsconfig.json tsconfig.server.json components.json next.config.ts ./

# Install all dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Stage 2: Builder - Build the application
FROM installer AS builder
WORKDIR /usr/src/app

# Set build-time argument for KEYSTONE_MODE
ARG KEYSTONE_MODE=admin
ENV KEYSTONE_MODE=${KEYSTONE_MODE}

# Build the Next.js app and the server
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

# Set environment variables
ENV NODE_ENV=production
ARG KEYSTONE_MODE=admin
ENV KEYSTONE_MODE=${KEYSTONE_MODE}

# Create a non-root user and group for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production dependencies from the installer stage
COPY --from=installer /usr/src/app/node_modules ./node_modules
# Copy production-ready build artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/server.ts ./server.ts

# Ensure the data directory exists and has the correct permissions
RUN mkdir -p data && chown -R appuser:appgroup data
USER appuser

# The port will be set by the PORT environment variable in docker-compose
EXPOSE 3000

# The command to start the app
CMD ["node", "dist/server.js"]
