# Stage 1: Build the Vite/React frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including tsx and devDependencies for building)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the production React/Vite static files into /app/dist
RUN npm run build

# Stage 2: Production runtime image
FROM node:22-alpine

WORKDIR /app

# Copy package files and install ALL dependencies 
# (We need tsx in production to run server.ts directly)
COPY package*.json ./
RUN npm ci

# Copy built static assets from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the server file and any other necessary source files
COPY server.ts ./
# If your server requires any other ts files or configs, copy them here too

# Expose the port Cloud Run expects
ENV PORT=8080
EXPOSE 8080

# Run the TypeScript server using tsx
CMD ["npx", "tsx", "server.ts"]