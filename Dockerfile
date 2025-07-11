# Use a specific Node.js version as a base image for the builder stage
FROM node:20-alpine as base

# Install openssl for the pem package
RUN apk add --no-cache openssl

# Set the working directory
WORKDIR /usr/src/app

# Create a public directory if it doesn't exist, to prevent build errors
RUN mkdir -p public

# The build context is the Git repository, so we can copy the files directly
# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application and the custom server
RUN npm run build

# ---

# Start a new, smaller image for the final production build
FROM node:20-alpine

# Install openssl for the pem package to generate certs on startup
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy production dependencies from the builder stage
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app/package*.json ./

# Copy the built application and necessary files from the base image
COPY --from=base /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/.next ./.next
COPY --from=base /usr/src/app/public ./public
COPY --from=base /usr/src/app/src ./src
COPY --from=base /usr/src/app/next.config.ts .
COPY --from=base /usr/src/app/data ./data
COPY --from=base /usr/src/app/apphosting.yaml .

# Expose the port the app runs on
EXPOSE 9002

# The command to start the server in production mode
CMD ["npm", "run", "start"]
