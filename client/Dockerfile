# Frontend React Development Container
FROM node:20-alpine

WORKDIR /app

# Copy package manifests and install dependencies automatically
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start React development server binding to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
