#!/bin/sh

echo "=== Docker entrypoint starting ==="
echo "Environment variables:"
echo "VITE_API_URL=${VITE_API_URL}"
echo "VITE_DEBUG=${VITE_DEBUG}"

# Generate config.js from environment variables at runtime
echo "Generating config.js..."
cat > /usr/share/nginx/html/config.js <<EOF
// Runtime configuration - generated from environment variables
window.ENV_CONFIG = {
  VITE_API_URL: '${VITE_API_URL:-http://localhost:8000}',
  VITE_DEBUG: '${VITE_DEBUG:-false}'
};
EOF

echo "Generated config.js:"
cat /usr/share/nginx/html/config.js
echo "=== Starting Nginx ==="

# Start nginx
exec nginx -g 'daemon off;'
