# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Install OpenSSL and other essentials
RUN apt-get update && apt-get install -y openssl procps

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# The app binds to this port
EXPOSE 9002
EXPOSE 4000
EXPOSE 3400

# The command to run the app will be specified in docker-compose.yml
CMD ["npm", "run", "dev"]
