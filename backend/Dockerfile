# Backend Dockerfile
FROM node:18-alpine

# Install OpenSSL and other dependencies
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install for development)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start the development server
CMD ["npm", "run", "dev"]
