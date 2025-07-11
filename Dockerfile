# Use a specific Node.js version as a base image for the builder stage
FROM node:20-alpine as base

# Set the working directory
WORKDIR /usr/src/app

# The build context is the Git repository, so we can copy the files directly
# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Ensure the public directory exists, even if it's empty in the source repo
RUN mkdir -p public

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# ---

# Start a new, smaller image for the final production build
FROM node:20-alpine

WORKDIR /usr/src/app

# Install production dependencies only
COPY --from=base /usr/src/app/package*.json ./
RUN npm install --omit=dev

# Copy the built application and necessary files from the base image
COPY --from=base /usr/src/app/.next ./.next
COPY --from=base /usr/src/app/public ./public
COPY --from=base /usr/src/app/server.ts .
COPY --from=base /usr/src/app/next.config.ts .
COPY --from=base /usr/src/app/data ./data
COPY --from=base /usr/src/app/apphosting.yaml .
COPY --from=base /usr/src/app/package.json .

# Expose the port the app runs on
EXPOSE 9002

# The command to start the server in production mode
CMD ["npm", "run", "dev"]
