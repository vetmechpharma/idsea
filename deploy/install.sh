#!/bin/bash
# ============================================
# IDSEA VPS Deployment Script
# Run on your VPS as root or with sudo
# ============================================

set -e

DOMAIN="idsea.org"
APP_DIR="/var/www/idsea"
LOG_DIR="/var/log/idsea"
BACKUP_DIR="/var/backups/idsea"

echo "========================================"
echo "  IDSEA — VPS Deployment"
echo "========================================"

# ── 1. System packages ──
echo "[1/9] Installing system packages..."
apt update && apt upgrade -y
apt install -y curl git nginx supervisor certbot python3-certbot-nginx ufw \
    python3.11 python3.11-venv python3-pip build-essential

# ── 2. Node.js 20 (for frontend build) ──
echo "[2/9] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    npm install -g yarn
fi
echo "Node: $(node --version), Yarn: $(yarn --version)"

# ── 3. MongoDB 7 ──
echo "[3/9] Installing MongoDB 7.0..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update && apt install -y mongodb-org
fi
systemctl start mongod
systemctl enable mongod
echo "MongoDB: $(mongod --version | head -1)"

# ── 4. Firewall ──
echo "[4/9] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ── 5. Directory setup ──
echo "[5/9] Setting up application directory..."
mkdir -p $APP_DIR $LOG_DIR $BACKUP_DIR
chown -R www-data:www-data $LOG_DIR

if [ ! -d "$APP_DIR/backend" ]; then
    echo ""
    echo "=========================================="
    echo "  IMPORTANT: Upload your code first!"
    echo "=========================================="
    echo "  Upload backend/ and frontend/ folders to $APP_DIR"
    echo "  Then re-run this script."
    echo ""
    echo "  Example using scp:"
    echo "    scp -r backend/ root@your-vps-ip:$APP_DIR/"
    echo "    scp -r frontend/ root@your-vps-ip:$APP_DIR/"
    echo "=========================================="
    exit 1
fi

# ── 6. Backend setup ──
echo "[6/9] Setting up Python backend..."
cd $APP_DIR/backend

if [ ! -d "venv" ]; then
    python3.11 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Create uploads dir
mkdir -p $APP_DIR/backend/uploads
chown -R www-data:www-data $APP_DIR/backend/uploads

# Check .env exists
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo ""
    echo "  WARNING: backend/.env not found!"
    echo "  Copy deploy/backend.env.production to $APP_DIR/backend/.env"
    echo "  and fill in your values before starting."
    echo ""
fi

# ── 7. Frontend build ──
echo "[7/9] Building frontend..."
cd $APP_DIR/frontend

if [ ! -f ".env" ]; then
    echo ""
    echo "  WARNING: frontend/.env not found!"
    echo "  Copy deploy/frontend.env.production to $APP_DIR/frontend/.env"
    echo "  and set REACT_APP_BACKEND_URL=https://$DOMAIN"
    echo ""
fi

yarn install --frozen-lockfile 2>/dev/null || yarn install
yarn build
echo "Frontend built: $(du -sh build/ | cut -f1)"

# ── 8. Supervisor config ──
echo "[8/9] Configuring Supervisor..."
cp $APP_DIR/deploy/supervisor-idsea.conf /etc/supervisor/conf.d/idsea-backend.conf
supervisorctl reread
supervisorctl update
supervisorctl restart idsea-backend 2>/dev/null || supervisorctl start idsea-backend
sleep 3
supervisorctl status idsea-backend

# ── 9. Nginx config ──
echo "[9/9] Configuring Nginx..."
cp $APP_DIR/deploy/nginx-idsea.conf /etc/nginx/sites-available/idsea
ln -sf /etc/nginx/sites-available/idsea /etc/nginx/sites-enabled/idsea
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# If SSL cert doesn't exist yet, use HTTP-only first
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo ""
    echo "  SSL certificate not found. Setting up HTTP-only first..."
    echo "  After DNS points to this server, run:"
    echo "    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo ""
    # Create temp HTTP-only config
    cat > /etc/nginx/sites-available/idsea << 'HTTPCONF'
server {
    listen 80;
    server_name idsea.org www.idsea.org;

    client_max_body_size 25M;
    root /var/www/idsea/frontend/build;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    location /uploads/ {
        alias /var/www/idsea/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
HTTPCONF
fi

systemctl restart nginx

echo ""
echo "========================================"
echo "  DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "  Backend:  $(supervisorctl status idsea-backend | awk '{print $2}')"
echo "  Nginx:    $(systemctl is-active nginx)"
echo "  MongoDB:  $(systemctl is-active mongod)"
echo ""
echo "  Next steps:"
echo "  1. Ensure backend/.env has correct values (JWT_SECRET, SMTP, etc.)"
echo "  2. Ensure frontend/.env has REACT_APP_BACKEND_URL=https://$DOMAIN"
echo "  3. Point DNS A record for $DOMAIN → this server's IP"
echo "  4. Run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "  5. Test: https://$DOMAIN"
echo ""
echo "  Admin login: https://$DOMAIN/admin"
echo "  Credentials: admin@idsea.org / Admin@123 (CHANGE AFTER FIRST LOGIN)"
echo "========================================"
