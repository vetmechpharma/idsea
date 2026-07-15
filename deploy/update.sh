#!/bin/bash
set -e
APP_DIR="/var/www/idsea"
DOMAIN="idsea.in"

echo "=== IDSEA Update ==="

cd $APP_DIR
sudo git pull origin main

cd $APP_DIR/backend
source venv/bin/activate
pip install -r requirements.txt --quiet
deactivate
sudo supervisorctl restart idsea-backend

cd $APP_DIR/frontend
printf "REACT_APP_BACKEND_URL=https://%s\nREACT_APP_RAZORPAY_KEY_ID=\n" "$DOMAIN" > .env
yarn install --frozen-lockfile 2>/dev/null || yarn install
yarn build

sudo systemctl reload nginx
sleep 2

echo ""
echo "=== Update Complete ==="
echo "Backend: $(sudo supervisorctl status idsea-backend | awk '{print $2}')"
echo "Nginx:   $(sudo systemctl is-active nginx)"
echo "Test:    $(curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/api/public/events)"
