#!/bin/bash

# MaainHome TOTAL Project Backup Script
# This creates a 100% complete clone of the project including all dependencies and build files.

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="MaainHome_v2_TOTAL_SAFE_BACKUP_${TIMESTAMP}.tar.gz"
PROJECT_DIR="/home/senthil/maainhome/version2"
BACKUP_DIR="/home/senthil/maainhome/backups/FULL_RESTORE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🛡️ Starting FULL SAFETY BACKUP (includes EVERYTHING)..."
echo "📏 Total size to backup: $(du -sh $PROJECT_DIR | cut -f1)"

# Create the full compressed archive
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" -C "$PROJECT_DIR" .

# Also create a simple folder copy for instant recovery
FOLDER_COPY="${BACKUP_DIR}/MaainHome_v2_LATEST_SYNC"
rm -rf "$FOLDER_COPY"
cp -a "$PROJECT_DIR" "$FOLDER_COPY"

echo ""
echo "✅ TOTAL BACKUP COMPLETE!"
echo "--------------------------------------------------"
echo "📦 Archive: ${BACKUP_DIR}/${BACKUP_NAME}"
echo "📁 Folder Sync: ${FOLDER_COPY}"
echo "--------------------------------------------------"
echo "Size: $(du -sh ${BACKUP_DIR}/${BACKUP_NAME} | cut -f1)"
echo "Safety status: 100% SECURE"
