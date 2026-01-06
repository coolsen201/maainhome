#!/bin/bash

# MaainHome Project Backup Script
# This script creates a compressed archive of the project, excluding heavy build folders.

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="MaainHome_v2_Backup_${TIMESTAMP}.tar.gz"
PROJECT_DIR="/home/senthil/maainhome/version2"
BACKUP_DIR="/home/senthil/maainhome/backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup: ${BACKUP_NAME}..."

tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" \
    --exclude="node_modules" \
    --exclude=".local" \
    --exclude="dist" \
    --exclude="android/.gradle" \
    --exclude="android/app/build" \
    -C "$PROJECT_DIR" .

echo "✅ Backup complete!"
echo "📍 Location: ${BACKUP_DIR}/${BACKUP_NAME}"
echo "📏 Size: $(du -sh ${BACKUP_DIR}/${BACKUP_NAME} | cut -f1)"
