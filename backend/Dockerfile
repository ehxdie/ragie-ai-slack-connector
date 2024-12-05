# Use the Node.js LTS version as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the rest of the application code to the container
COPY . .

# Install dependencies
RUN npm install

# Expose the port your app will run on
EXPOSE 3000

# Command to start the application
CMD ["node", "server.js"]