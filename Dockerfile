# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy configuration files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.server.json ./
COPY tailwind.config.ts ./
COPY next.config.ts ./
COPY components.json ./

# Install all dependencies (including dev) for the build
RUN npm install

# Copy the rest of the application source code
COPY . .

# Set build-time argument for KEYSTONE_MODE (can be overridden)
ARG KEYSTONE_MODE=admin
ENV KEYSTONE_MODE=${KEYSTONE_MODE}

# Build the Next.js app and the server
RUN npm run build

# Remove development dependencies for a smaller production image
RUN npm prune --omit=dev


# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

# Set environment variables for production
ENV NODE_ENV=production
ARG KEYSTONE_MODE=admin
ENV KEYSTONE_MODE=${KEYSTONE_MODE}

# Create a non-root user and group for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create the data directory and give the new user ownership.
# This is crucial for allowing the app to write to the persistent volume.
RUN mkdir -p /usr/src/app/data && chown -R appuser:appgroup /usr/src/app/data

# Switch to the non-root user
USER appuser

# Copy built assets from the builder stage, setting ownership
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/package.json ./package.json

# Copy production node_modules
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Expose the default port (can be mapped differently in docker-compose)
EXPOSE 9002

# The default command to start the application.
# This will be used if not overridden in docker-compose.yml.
CMD ["npm", "run", "start"]
