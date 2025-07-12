# Stage 1: Builder - Installs dependencies and builds the app
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Install OS dependencies needed for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy configuration files first to leverage Docker cache
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.server.json ./
COPY tailwind.config.ts ./
COPY next.config.ts ./
COPY components.json ./

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy the rest of the application source code
COPY . .

# Set build-time argument for KEYSTONE_MODE (defaults to admin)
# This can be overridden during the build process
ARG KEYSTONE_MODE=admin
ENV KEYSTONE_MODE=${KEYSTONE_MODE}

# Build the Next.js app and the custom server
RUN npm run build

# Remove development dependencies to shrink the image size
RUN npm prune --omit=dev


# Stage 2: Runner - Creates the final, smaller production image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

# Set environment variables for production
ENV NODE_ENV=production
ARG KEYSTONE_MODE=admin
ENV KEYSTONE_MODE=${KEYSTONE_MODE}

# Create a non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy only the necessary artifacts from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/package.json ./package.json

# Expose the port the app will run on. This is for documentation;
# the actual port is mapped in docker-compose or the `docker run` command.
EXPOSE 3000

# The command to start the application
CMD ["npm", "run", "start"]
