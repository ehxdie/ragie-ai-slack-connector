# Use the Node.js LTS version as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if present) to leverage Docker's caching for dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Build the TypeScript code to JavaScript
RUN npm run build

# Expose the port your app will run on
EXPOSE 3000

# Command to start the application
CMD ["npm", "run", "start"]
