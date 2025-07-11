# Use a base image with Node.js and OpenSSL
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# Install git and openssl
RUN apt-get update && apt-get install -y git openssl && rm -rf /var/lib/apt/get/lists/*

# Arguments for the Git repository and branch
ARG GIT_REPO_URL
ARG GIT_BRANCH=main

# Clone the specified branch of the repository
RUN git clone --single-branch --branch ${GIT_BRANCH} ${GIT_REPO_URL} .

# Install dependencies
RUN npm install

# Build the Next.js app
RUN npm run build

# Expose the port the app will run on
EXPOSE 9003

# Set the command to start the server
CMD ["npm", "run", "dev"]
