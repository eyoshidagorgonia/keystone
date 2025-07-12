# Stage 1: Build Environment
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

# Install all dependencies (including devDependencies for the build)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js app and the server
RUN npm run build

# Remove development dependencies to keep the image lean
RUN npm prune --omit=dev


# Stage 2: Production Environment
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

# Set environment variables
ENV NODE_ENV=production
ARG KEYSTONE_MODE=admin
ENV KEYSTONE_MODE=${KEYSTONE_MODE}

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy necessary files from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/package.json ./package.json

# Expose the port (the actual port mapping is in docker-compose)
EXPOSE 3000

# The CMD will be overridden by the command in docker-compose.yml
# but we provide a default here for clarity.
CMD ["npm", "run", "start"]
