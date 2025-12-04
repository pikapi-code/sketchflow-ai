# Production stage with nginx
# Note: Application is pre-built in CI, so we just serve the static files
FROM nginx:alpine

# Copy built files (dist folder is already built in CI)
COPY dist/ /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]