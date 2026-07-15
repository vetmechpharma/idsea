# IDSEA Website — VPS Deployment Guide

## Minimum VPS Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 1 vCPU | 2 vCPU |
| **RAM** | 2 GB | 4 GB |
| **Storage** | 20 GB SSD | 40 GB SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04/24.04 LTS |
| **Bandwidth** | 1 TB/month | 2 TB/month |

### Why These Specs?
- **MongoDB** needs ~500MB RAM at idle, grows with data
- **FastAPI (Uvicorn)** uses ~200MB RAM
- **Nginx + React build** is lightweight (~50MB)
- **Email queue scheduler** runs as background task (minimal overhead)
- **PDF generation** (reportlab) can spike CPU briefly during certificate bulk generation

---

## Software Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.11+ | Backend runtime |
| **Node.js** | 20.x LTS | Frontend build only (not needed at runtime) |
| **MongoDB** | 7.0+ | Database |
| **Nginx** | Latest | Reverse proxy + static file serving |
| **Supervisor** | Latest | Process management |
| **Certbot** | Latest | SSL certificates (Let's Encrypt) |

---

## Step-by-Step Deployment

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl git nginx supervisor certbot python3-certbot-nginx ufw

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Install MongoDB 7.0

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add repo
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update && sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Install Python 3.11

```bash
sudo apt install -y python3.11 python3.11-venv python3-pip
```

### 4. Install Node.js 20 (for building frontend)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g yarn
```

### 5. Clone & Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/idsea
cd /var/www/idsea

# Clone your repository (or upload files)
# git clone <your-repo-url> .

# Backend setup
cd /var/www/idsea/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend build
cd /var/www/idsea/frontend
yarn install
yarn build
```

### 6. Environment Configuration

**Backend (`/var/www/idsea/backend/.env`):**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=idsea_db
JWT_SECRET=<generate-a-strong-random-secret-64-chars>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@idsea.org
RAZORPAY_KEY_ID=<your-razorpay-key>
RAZORPAY_KEY_SECRET=<your-razorpay-secret>
```

Generate JWT secret:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 7. Supervisor Configuration

**Create `/etc/supervisor/conf.d/idsea-backend.conf`:**
```ini
[program:idsea-backend]
command=/var/www/idsea/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
directory=/var/www/idsea/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/idsea/backend.err.log
stdout_logfile=/var/log/idsea/backend.out.log
environment=PATH="/var/www/idsea/backend/venv/bin"
```

```bash
sudo mkdir -p /var/log/idsea
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start idsea-backend
```

### 8. Nginx Configuration

**Create `/etc/nginx/sites-available/idsea`:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend (React build)
    root /var/www/idsea/frontend/build;
    index index.html;

    # Client max body size for file uploads
    client_max_body_size 20M;

    # API proxy to FastAPI backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Uploaded files
    location /uploads/ {
        alias /var/www/idsea/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # React SPA - all non-API routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/idsea /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 9. SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
# Follow prompts, auto-renew is configured automatically
```

### 10. Frontend .env for Production

Before building frontend, update `/var/www/idsea/frontend/.env`:
```env
REACT_APP_BACKEND_URL=https://your-domain.com
```

Then rebuild:
```bash
cd /var/www/idsea/frontend
yarn build
```

---

## Post-Deployment Checklist

- [ ] MongoDB is running: `sudo systemctl status mongod`
- [ ] Backend is running: `sudo supervisorctl status idsea-backend`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] SSL is active: Visit https://your-domain.com
- [ ] Admin login works: https://your-domain.com/admin
- [ ] Public pages load: Home, About, Events, Contact, etc.
- [ ] File uploads work (test image upload in admin)
- [ ] SMTP configured (test from Admin → Email System)
- [ ] Razorpay keys set (if payments needed)
- [ ] MongoDB backup configured (see below)

---

## Maintenance

### MongoDB Backup (Daily Cron)
```bash
# Create backup script
sudo tee /opt/backup-mongo.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
mkdir -p $BACKUP_DIR
mongodump --db idsea_db --out $BACKUP_DIR/$(date +%Y%m%d)
# Keep last 7 days
find $BACKUP_DIR -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +
EOF
sudo chmod +x /opt/backup-mongo.sh

# Add to crontab
echo "0 2 * * * /opt/backup-mongo.sh" | sudo crontab -
```

### Log Rotation
Supervisor handles log rotation. Check logs:
```bash
tail -f /var/log/idsea/backend.err.log
tail -f /var/log/idsea/backend.out.log
```

### Update Application
```bash
cd /var/www/idsea
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo supervisorctl restart idsea-backend

# Frontend
cd ../frontend
yarn install
yarn build
```

---

## Recommended VPS Providers

| Provider | Plan | Price/month | Notes |
|----------|------|-------------|-------|
| **DigitalOcean** | Basic Droplet 2GB | $12 | Good for starting |
| **DigitalOcean** | Basic Droplet 4GB | $24 | Recommended |
| **AWS Lightsail** | 2GB | $10 | Budget option |
| **Vultr** | Cloud Compute 2GB | $12 | Good performance |
| **Hetzner** | CX22 (4GB) | €5.49 | Best value (EU) |
| **Hostinger VPS** | KVM2 (8GB) | $8.99 | Budget with more RAM |

**For Indian hosting (lower latency):**
| Provider | Plan | Price/month |
|----------|------|-------------|
| **DigitalOcean BLR** | 4GB Bangalore DC | $24 |
| **AWS Mumbai** | t3.small (2GB) | ~$15 |
| **Hostinger India** | VPS KVM2 | ~₹699 |
