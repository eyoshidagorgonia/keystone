# Use a specific Node.js version for reproducibility
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# Install necessary dependencies:
# - git: for cloning the repository
# - openssl: for the 'pem' package to generate self-signed certs
RUN apt-get update && apt-get install -y openssl git && rm -rf /var/lib/apt/lists/*

# Arguments for the Git repository
ARG GIT_REPO_URL
ARG GIT_BRANCH=main

# Clone the repository and checkout the specified branch
RUN git clone --branch ${GIT_BRANCH} ${GIT_REPO_URL} .

# Install npm dependencies
RUN npm install

# Copy the data directory if it exists locally, otherwise create it
# This ensures the volume mount point exists.
RUN mkdir -p /usr/src/app/data

# Build the Next.js application
RUN npm run build

# Expose the port the app will run on
# The actual port will be set by the environment variable in docker-compose
EXPOSE 9002
EXPOSE 9003
EXPOSE 4000
EXPOSE 3400

# The command to run the application will be provided by docker-compose.yml
CMD ["npm", "run", "dev"]
