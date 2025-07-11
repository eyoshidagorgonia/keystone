# Use an official Node.js image as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install git and openssl
RUN apt-get update && apt-get install -y openssl git

# Define build arguments for the git repository
# These can be set during the 'docker build' command
ARG GIT_REPO_URL=https://github.com/your-username/your-repo.git
ARG GIT_BRANCH=main

# Clone the specific branch of the repository
# The --depth 1 flag creates a shallow clone for a faster build
RUN git clone --depth 1 --branch ${GIT_BRANCH} ${GIT_REPO_URL} .

# Copy package.json and package-lock.json (if available)
# This step is still useful to leverage Docker layer caching for dependencies
COPY package*.json ./

# Install app dependencies
RUN npm install

# The COPY . . command is no longer needed as we cloned the repo.

# The Next.js app will be started by the command in docker-compose.yml
