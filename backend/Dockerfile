FROM node:20-alpine

WORKDIR /app

# Install dependencies first for caching purposes
COPY package*.json ./
RUN npm ci

# Copy remaining source code
COPY . .

# Build the TypeScript codebase
RUN npm run build

# Expose backend port
EXPOSE 3001

# Start the compiled index.js
CMD ["npm", "start"]
