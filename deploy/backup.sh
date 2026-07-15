#!/bin/bash
# ============================================
# IDSEA — MongoDB Backup Script
# Add to crontab: 0 2 * * * /var/www/idsea/deploy/backup.sh
# ============================================

BACKUP_DIR="/var/backups/idsea/mongodb"
DATE=$(date +%Y%m%d_%H%M)
DB_NAME="idsea_db"

mkdir -p $BACKUP_DIR

echo "[$(date)] Starting MongoDB backup..."
mongodump --db $DB_NAME --out $BACKUP_DIR/$DATE --quiet

# Compress
cd $BACKUP_DIR
tar -czf $DATE.tar.gz $DATE/
rm -rf $DATE/

echo "[$(date)] Backup saved: $BACKUP_DIR/$DATE.tar.gz ($(du -sh $DATE.tar.gz | cut -f1))"

# Keep last 14 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +14 -delete
echo "[$(date)] Old backups cleaned (keeping 14 days)"
