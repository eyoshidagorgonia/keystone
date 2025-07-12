# Stage 1: Base image with build dependencies
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Stage 2: Install production dependencies
FROM base AS deps
# Install production dependencies
RUN npm install --omit=dev


# Stage 3: Build the application
FROM base AS builder
# Copy the dependency installation from the 'deps' stage
COPY --from=deps /usr/src/app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .

# Set build-time argument for KEYSTONE_MODE
ARG KEYSTONE_MODE=admin
ENV KEYSTONE_MODE=${KEYSTONE_MODE}

# Build the Next.js app and the server
RUN npm run build


# Stage 4: Production image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

# Set environment variables
ENV NODE_ENV=production
ARG KEYSTONE_MODE=admin
ENV KEYSTONE_MODE=${KEYSTONE_MODE}

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy built assets from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder --chown=appuser:appgroup /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Expose the port the app runs on
# The actual port will be mapped in docker-compose.yml
EXPOSE 3000

# The CMD will be overridden by the command in docker-compose.yml
# but we provide a default here for clarity.
CMD ["npm", "run", "start"]
