# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the ports for the Next.js UI and Genkit services
# 9002 for Next.js dev server
# 4000 for Genkit Inspector UI
# 3400 for Genkit Flows API
EXPOSE 9002 4000 3400

# The command to run both services will be in docker-compose.yml
CMD ["npm", "run", "dev"]
