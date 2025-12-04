#!/bin/bash

# Deployment script for VM
# This script can be run manually on the VM or via GitHub Actions

set -e

DEPLOY_DIR="/var/www/sketchflow-ai"
BACKUP_DIR="/var/www/backups/sketchflow-ai"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment..."

# Create backup directory if it doesn't exist
sudo mkdir -p "$BACKUP_DIR"

# Backup existing deployment if it exists
if [ -d "$DEPLOY_DIR" ]; then
    echo "📦 Creating backup..."
    sudo tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$DEPLOY_DIR" .
fi

# Create deployment directory if it doesn't exist
sudo mkdir -p "$DEPLOY_DIR"

# Extract new deployment (assuming deploy.tar.gz is in /tmp)
if [ -f "/tmp/deploy.tar.gz" ]; then
    echo "📂 Extracting new deployment..."
    cd /tmp
    tar -xzf deploy.tar.gz
    
    # Copy files to deployment directory
    echo "📋 Copying files..."
    sudo rm -rf "$DEPLOY_DIR"/*
    sudo cp -r dist/* "$DEPLOY_DIR"/
    
    # Set proper permissions
    sudo chown -R www-data:www-data "$DEPLOY_DIR"
    sudo chmod -R 755 "$DEPLOY_DIR"
    
    # Cleanup
    rm -f deploy.tar.gz
    rm -rf dist package.json
    
    echo "✅ Deployment completed successfully!"
    
    # Reload nginx if it's installed
    if command -v nginx &> /dev/null; then
        echo "🔄 Reloading nginx..."
        sudo systemctl reload nginx || sudo nginx -s reload
    fi
    
    # Restart docker container if using docker-compose
    if [ -f "/opt/sketchflow-ai/docker-compose.yml" ]; then
        echo "🐳 Restarting Docker container..."
        cd /opt/sketchflow-ai
        docker-compose up -d --build
    fi
else
    echo "❌ Error: deploy.tar.gz not found in /tmp"
    exit 1
fi

echo "🎉 Deployment finished!"

