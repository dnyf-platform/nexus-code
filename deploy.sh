#!/bin/bash
echo "🚀 Deploying NexusCode Production Server..."

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Install dependencies
npm install --production

# Start/Restart with PM2
pm2 delete nexuscode 2>/dev/null
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo "✅ Deployment complete!"
pm2 status
