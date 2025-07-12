# Stage 1: Base image with build dependencies
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Stage 2: Install all dependencies (including dev) for building
FROM base AS deps
COPY package*.json ./
RUN npm install

# Stage 3: Build the application
FROM deps AS builder
COPY . .
RUN npm run build

# Stage 4: Production image - lean and secure
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only necessary artifacts from previous stages
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json

# The app will run as this user
USER appuser

EXPOSE 3000

# The command to start the app.
# The server.ts file will handle which port to use based on KEYSTONE_MODE
CMD ["node", "dist/server.js"]
