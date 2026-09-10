# Production-ready Dockerfile for ServiceFlow Backend
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install build dependencies if needed
RUN apk add --no-cache libc6-compat

# Copy package manifests
COPY package*.json ./

# Install dependencies (clean install)
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose API port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production

# Run server
CMD ["node", "server.js"]
