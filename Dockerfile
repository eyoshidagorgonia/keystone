# Use a specific Node.js version as a base image
FROM node:20-alpine as base

# Set the working directory
WORKDIR /usr/src/app

# Install dependencies required for the build process, including git
RUN apk add --no-cache openssl git

# Define build arguments for the Git repository
ARG GIT_REPO_URL
ARG GIT_BRANCH=main

# Clone the repository into a temporary directory and move its contents
RUN git clone --branch ${GIT_BRANCH} ${GIT_REPO_URL} /tmp/app && \
    mv /tmp/app/.git . && \
    mv /tmp/app/* . && \
    rm -rf /tmp/app

# Install npm dependencies
RUN npm install

# Build the Next.js application
RUN npm run build

# Start a new, smaller image for the final production build
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy dependencies and build output from the base image
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app/.next ./.next
COPY --from=base /usr/src/app/public ./public
COPY --from=base /usr/src/app/package.json .
COPY --from=base /usr/src/app/server.ts .
COPY --from=base /usr/src/app/next.config.ts .
COPY --from=base /usr/src/app/data ./data

# Expose the port the app runs on
# The default port is 9002, but we use an environment variable
EXPOSE 9002

# The command to start the server
# This will be overridden by docker-compose for different modes
CMD ["npm", "run", "dev"]
