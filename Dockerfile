# 1. Base Image
FROM node:20-slim

# 2. Set Build Arguments
ARG GIT_REPO_URL
ARG GIT_BRANCH=main

# 3. Install Dependencies
# Install git to clone the repo, and openssl for the dev server's certificate generation.
RUN apt-get update && apt-get install -y git openssl

# 4. Clone Repository
WORKDIR /usr/src/app
RUN git clone --branch ${GIT_BRANCH} ${GIT_REPO_URL} .

# 5. Install Node.js Dependencies
RUN npm install

# 6. Set up environment
# Expose the default port for the application.
# This will be overridden by the PORT env var in docker-compose.yml or docker run.
EXPOSE 9002

# 7. Define the Command to Run the App
# This command will be used if no other command is specified in 'docker run' or 'docker-compose'.
CMD ["npm", "run", "dev"]
