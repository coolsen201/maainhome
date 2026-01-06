#!/bin/bash
# MaainHome Version 2 Startup

cd "$(dirname "$0")"

# Load NVM if it exists
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
fi

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Start the development server
echo "Starting Version 2 on Port 5000..."
npm run dev
