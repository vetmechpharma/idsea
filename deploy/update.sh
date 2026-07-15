#!/bin/bash
# ============================================
# IDSEA — Quick Update Script
# Run after pulling new code from GitHub
# ============================================

set -e
APP_DIR="/var/www/idsea"

echo "=== IDSEA Update ==="

# Backend
echo "[1/3] Updating backend..."
cd $APP_DIR/backend
source venv/bin/activate
pip install -r requirements.txt --quiet
deactivate
sudo supervisorctl restart idsea-backend
sleep 2
echo "Backend: $(sudo supervisorctl status idsea-backend | awk '{print $2}')"

# Frontend
echo "[2/3] Rebuilding frontend..."
cd $APP_DIR/frontend
yarn install --frozen-lockfile 2>/dev/null || yarn install
yarn build
echo "Frontend built: $(du -sh build/ | cut -f1)"

# Nginx
echo "[3/3] Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== Update complete! ==="
echo "Backend: $(sudo supervisorctl status idsea-backend | awk '{print $2}')"
echo "Nginx:   $(sudo systemctl is-active nginx)"
