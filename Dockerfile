# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# npm ci reproduces the committed lockfile exactly. --legacy-peer-deps is
# required because a transitive peer conflict (@schlomoh/react-cookieconsent
# pins styled-components v5 while the app uses v6) makes a strict npm ci fail.
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application WITHOUT baking in environment variables
# The app will load config from /config.js at runtime
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Install dos2unix for entrypoint script line ending fixes
RUN apk add --no-cache dos2unix

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy and set execute permission for entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
# Fix line endings and set execute permission
RUN dos2unix /docker-entrypoint.sh 2>/dev/null || sed -i 's/\r$//' /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 8080

# Use entrypoint to generate config.js at runtime
ENTRYPOINT ["/docker-entrypoint.sh"]
