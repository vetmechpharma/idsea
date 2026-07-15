# ═══════════════════════════════════════════════════════════════
#  IDSEA.IN — Complete VPS Installation Guide
#  VPS: Ubuntu 24.04 (with Animitra + VetMechPharma already running)
# ═══════════════════════════════════════════════════════════════
#
#  READ EVERYTHING. Follow step by step. Don't skip.
#  Estimated time: 20-30 minutes
#
# ═══════════════════════════════════════════════════════════════


# ─────────────────────────────────────────────────────────────
# STEP 0: SSH INTO YOUR VPS
# ─────────────────────────────────────────────────────────────
# Open terminal on your computer and run:

ssh root@YOUR_VPS_IP

# Replace YOUR_VPS_IP with your actual VPS IP address
# Example: ssh root@103.45.67.89


# ─────────────────────────────────────────────────────────────
# STEP 1: CHECK WHAT PORTS ARE ALREADY IN USE
# ─────────────────────────────────────────────────────────────
# This is important — we don't want to use a port that
# Animitra or VetMechPharma is already using

sudo ss -tlnp | grep -E '800[0-9]|300[0-9]|500[0-9]'

# You'll see output like:
#   LISTEN  0.0.0.0:8001  ...uvicorn...   ← some project using 8001
#   LISTEN  0.0.0.0:8002  ...uvicorn...   ← some project using 8002
#
# NOTE DOWN which ports are used.
# We will use port 8003 for IDSEA (if 8003 is free)
# If 8003 is also taken, use 8004
#
# Also check supervisor to see existing projects:

sudo supervisorctl status

# This shows all running projects. Note them down.


# ─────────────────────────────────────────────────────────────
# STEP 2: CHECK EXISTING NGINX SITES
# ─────────────────────────────────────────────────────────────

ls -la /etc/nginx/sites-enabled/

# This shows which websites are already configured
# You should see files for animitra and vetmechpharma
# We will ADD a new file for idsea.in — won't touch others


# ─────────────────────────────────────────────────────────────
# STEP 3: CREATE IDSEA DIRECTORY
# ─────────────────────────────────────────────────────────────

sudo mkdir -p /var/www/idsea
sudo mkdir -p /var/log/idsea
cd /var/www/idsea


# ─────────────────────────────────────────────────────────────
# STEP 4: CLONE CODE FROM GITHUB
# ─────────────────────────────────────────────────────────────
# Replace YOUR_GITHUB_REPO with your actual repo URL

cd /var/www/idsea
sudo git clone YOUR_GITHUB_REPO .

# Example:
# sudo git clone https://github.com/yourusername/idsea-website.git .
#
# The dot (.) at the end means clone INTO current directory
#
# If it asks for GitHub credentials, use a Personal Access Token
# (GitHub → Settings → Developer settings → Personal access tokens)
#
# After cloning, verify the structure:

ls -la

# You should see:
#   backend/
#   frontend/
#   deploy/
#   ...


# ─────────────────────────────────────────────────────────────
# STEP 5: SETUP BACKEND (Python)
# ─────────────────────────────────────────────────────────────

cd /var/www/idsea/backend

# Create Python virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install all Python packages
pip install --upgrade pip
pip install -r requirements.txt

# Deactivate virtual environment
deactivate

# Create uploads directory
mkdir -p /var/www/idsea/backend/uploads
sudo chown -R www-data:www-data /var/www/idsea/backend/uploads


# ─────────────────────────────────────────────────────────────
# STEP 6: CREATE BACKEND .env FILE
# ─────────────────────────────────────────────────────────────
# This is the most important step. This file has all your secrets.

# First, generate a random JWT secret:
python3 -c "import secrets; print(secrets.token_hex(32))"

# COPY the output. You'll paste it below.

# Now create the .env file:
sudo nano /var/www/idsea/backend/.env

# ── PASTE THIS CONTENT (edit the values marked with <<<) ──
# ┌─────────────────────────────────────────────────────────┐
# │                                                         │
# │  MONGO_URL=mongodb://localhost:27017                    │
# │  DB_NAME=idsea_db                                       │
# │  CORS_ORIGINS=https://idsea.in,https://www.idsea.in    │
# │  JWT_SECRET_KEY=PASTE_YOUR_GENERATED_SECRET_HERE   <<<  │
# │  SMTP_HOST=smtp.gmail.com                               │
# │  SMTP_PORT=587                                          │
# │  SMTP_USER=your-email@gmail.com                    <<<  │
# │  SMTP_PASS=your-gmail-app-password                 <<<  │
# │  FROM_EMAIL=noreply@idsea.in                            │
# │  RAZORPAY_KEY_ID=                                       │
# │  RAZORPAY_KEY_SECRET=                                   │
# │                                                         │
# └─────────────────────────────────────────────────────────┘
#
# Save: Press Ctrl+O, then Enter, then Ctrl+X
#
# NOTE about Gmail SMTP:
#   1. Go to https://myaccount.google.com/apppasswords
#   2. Generate an "App password" for "Mail"
#   3. Use that 16-character password as SMTP_PASS
#   4. Don't use your real Gmail password
#
# NOTE about Razorpay:
#   You can set these later from Admin Panel → Payment Settings
#   Leave blank for now if you don't have keys yet


# ─────────────────────────────────────────────────────────────
# STEP 7: CREATE FRONTEND .env FILE
# ─────────────────────────────────────────────────────────────

sudo nano /var/www/idsea/frontend/.env

# ── PASTE THIS CONTENT ──
# ┌─────────────────────────────────────────────────────────┐
# │                                                         │
# │  REACT_APP_BACKEND_URL=https://idsea.in                 │
# │  REACT_APP_RAZORPAY_KEY_ID=                             │
# │                                                         │
# └─────────────────────────────────────────────────────────┘
#
# Save: Ctrl+O → Enter → Ctrl+X


# ─────────────────────────────────────────────────────────────
# STEP 8: BUILD FRONTEND
# ─────────────────────────────────────────────────────────────

cd /var/www/idsea/frontend

# Install node packages
yarn install

# Build production bundle (this takes 1-2 minutes)
yarn build

# Verify build succeeded:
ls -la build/
# You should see index.html and static/ folder
# Size should be about 6-7MB


# ─────────────────────────────────────────────────────────────
# STEP 9: SETUP SUPERVISOR (Backend Process Manager)
# ─────────────────────────────────────────────────────────────
# This keeps the backend running and auto-restarts if it crashes
#
# IMPORTANT: If port 8003 was already in use (from Step 1),
# change 8003 to 8004 in the command below

sudo nano /etc/supervisor/conf.d/idsea.conf

# ── PASTE THIS CONTENT ──
# ┌─────────────────────────────────────────────────────────────────┐
# │                                                                 │
# │  [program:idsea-backend]                                        │
# │  command=/var/www/idsea/backend/venv/bin/uvicorn server:app     │
# │      --host 0.0.0.0 --port 8003 --workers 2 --log-level info   │
# │  directory=/var/www/idsea/backend                               │
# │  user=www-data                                                  │
# │  autostart=true                                                 │
# │  autorestart=true                                               │
# │  startretries=5                                                 │
# │  stopwaitsecs=30                                                │
# │  stderr_logfile=/var/log/idsea/backend.err.log                  │
# │  stdout_logfile=/var/log/idsea/backend.out.log                  │
# │  stderr_logfile_maxbytes=10MB                                   │
# │  stdout_logfile_maxbytes=10MB                                   │
# │  stderr_logfile_backups=3                                       │
# │  stdout_logfile_backups=3                                       │
# │  environment=PATH="/var/www/idsea/backend/venv/bin"             │
# │                                                                 │
# └─────────────────────────────────────────────────────────────────┘
#
# Save: Ctrl+O → Enter → Ctrl+X

# Tell supervisor to pick up the new config:
sudo supervisorctl reread
sudo supervisorctl update

# Start the IDSEA backend:
sudo supervisorctl start idsea-backend

# Check it's running:
sudo supervisorctl status

# You should see:
#   animitra-backend        RUNNING   ...
#   vetmechpharma-backend   RUNNING   ...
#   idsea-backend           RUNNING   ...     ← NEW!

# Wait 3 seconds, then test:
sleep 3
curl http://localhost:8003/api/health 2>/dev/null || curl http://localhost:8003/api/public/events 2>/dev/null

# If you see JSON response, backend is working!
# If you see error, check logs:
#   sudo tail -30 /var/log/idsea/backend.err.log


# ─────────────────────────────────────────────────────────────
# STEP 10: SETUP NGINX (Web Server)
# ─────────────────────────────────────────────────────────────
# This creates a NEW nginx config for idsea.in
# It does NOT touch your existing Animitra/VetMechPharma configs

sudo nano /etc/nginx/sites-available/idsea.in

# ── PASTE THIS CONTENT ──
# ── (if you used port 8004 instead of 8003, change it below) ──
# ┌─────────────────────────────────────────────────────────────────┐
# │                                                                 │
# │  server {                                                       │
# │      listen 80;                                                 │
# │      server_name idsea.in www.idsea.in;                         │
# │                                                                 │
# │      client_max_body_size 25M;                                  │
# │      root /var/www/idsea/frontend/build;                        │
# │      index index.html;                                          │
# │                                                                 │
# │      gzip on;                                                   │
# │      gzip_vary on;                                              │
# │      gzip_min_length 1024;                                      │
# │      gzip_types text/plain text/css application/json            │
# │          application/javascript text/xml application/xml        │
# │          text/javascript image/svg+xml;                         │
# │                                                                 │
# │      location /api/ {                                           │
# │          proxy_pass http://127.0.0.1:8003/api/;                 │
# │          proxy_http_version 1.1;                                │
# │          proxy_set_header Host $host;                           │
# │          proxy_set_header X-Real-IP $remote_addr;               │
# │          proxy_set_header X-Forwarded-For                       │
# │              $proxy_add_x_forwarded_for;                        │
# │          proxy_set_header X-Forwarded-Proto $scheme;            │
# │          proxy_read_timeout 300s;                               │
# │          proxy_connect_timeout 75s;                             │
# │          proxy_send_timeout 300s;                               │
# │      }                                                         │
# │                                                                 │
# │      location /uploads/ {                                       │
# │          alias /var/www/idsea/backend/uploads/;                 │
# │          expires 30d;                                           │
# │          add_header Cache-Control "public, immutable";          │
# │          access_log off;                                        │
# │      }                                                         │
# │                                                                 │
# │      location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|            │
# │          woff|woff2|ttf|eot)$ {                                 │
# │          expires 1y;                                            │
# │          add_header Cache-Control "public, immutable";          │
# │          access_log off;                                        │
# │      }                                                         │
# │                                                                 │
# │      location / {                                               │
# │          try_files $uri $uri/ /index.html;                      │
# │      }                                                         │
# │                                                                 │
# │      add_header X-Frame-Options "SAMEORIGIN" always;            │
# │      add_header X-Content-Type-Options "nosniff" always;        │
# │  }                                                              │
# │                                                                 │
# └─────────────────────────────────────────────────────────────────┘
#
# Save: Ctrl+O → Enter → Ctrl+X

# Enable the site (create symlink):
sudo ln -s /etc/nginx/sites-available/idsea.in /etc/nginx/sites-enabled/idsea.in

# TEST nginx config (very important — if this fails, DON'T restart):
sudo nginx -t

# If it says "syntax is ok" and "test is successful", proceed:
sudo systemctl reload nginx

# If nginx -t shows error, check your file for typos.
# DO NOT restart nginx if there's an error — it will break your other sites!

# Verify all sites still work:
sudo systemctl status nginx


# ─────────────────────────────────────────────────────────────
# STEP 11: POINT YOUR DOMAIN TO VPS
# ─────────────────────────────────────────────────────────────
# Go to your domain registrar (GoDaddy, Namecheap, etc.)
# and set these DNS records:
#
#   Type    Host    Value               TTL
#   ──────────────────────────────────────────
#   A       @       YOUR_VPS_IP         600
#   A       www     YOUR_VPS_IP         600
#
# Replace YOUR_VPS_IP with your actual VPS IP
# Example: 103.45.67.89
#
# DNS takes 5-30 minutes to propagate.
# You can check with:

dig idsea.in +short
# Should show your VPS IP

# Test the website (HTTP):
curl -I http://idsea.in
# Should return HTTP/1.1 200 OK


# ─────────────────────────────────────────────────────────────
# STEP 12: INSTALL SSL CERTIFICATE (HTTPS)
# ─────────────────────────────────────────────────────────────
# Only do this AFTER DNS is pointing to your VPS

sudo certbot --nginx -d idsea.in -d www.idsea.in

# It will ask:
#   - Enter email: your-email@gmail.com
#   - Agree to terms: Y
#   - Share email: N
#   - Redirect HTTP to HTTPS: 2 (Yes)
#
# Certbot will automatically:
#   - Get a free SSL certificate
#   - Update your nginx config for HTTPS
#   - Set up auto-renewal
#
# Verify HTTPS works:
curl -I https://idsea.in


# ─────────────────────────────────────────────────────────────
# STEP 13: VERIFY EVERYTHING WORKS
# ─────────────────────────────────────────────────────────────

echo ""
echo "=== CHECKING ALL SERVICES ==="
echo ""

echo "MongoDB:"
sudo systemctl status mongod | grep Active
echo ""

echo "Supervisor (all projects):"
sudo supervisorctl status
echo ""

echo "Nginx:"
sudo systemctl status nginx | grep Active
echo ""

echo "IDSEA API test:"
curl -s https://idsea.in/api/public/events | head -c 100
echo ""
echo ""

echo "Other projects (should still work):"
# Replace with your actual domains:
# curl -I https://animitra.com
# curl -I https://vetmechpharma.com

echo ""
echo "=== ALL DONE! ==="
echo ""
echo "Open in browser:"
echo "  Website:  https://idsea.in"
echo "  Admin:    https://idsea.in/admin"
echo "  Login:    admin@idsea.org / Admin@123"
echo ""


# ─────────────────────────────────────────────────────────────
# STEP 14: SETUP DAILY BACKUP (Optional but recommended)
# ─────────────────────────────────────────────────────────────

sudo mkdir -p /var/backups/idsea

# Add backup to crontab (runs daily at 2 AM):
(sudo crontab -l 2>/dev/null; echo "0 2 * * * mongodump --db idsea_db --out /var/backups/idsea/\$(date +\%Y\%m\%d) --quiet && find /var/backups/idsea -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +") | sudo crontab -

# Verify crontab was added:
sudo crontab -l


# ═══════════════════════════════════════════════════════════════
#  DONE! Your IDSEA website is live at https://idsea.in
# ═══════════════════════════════════════════════════════════════


# ─────────────────────────────────────────────────────────────
# USEFUL COMMANDS (bookmark these)
# ─────────────────────────────────────────────────────────────
#
# Check IDSEA backend status:
#   sudo supervisorctl status idsea-backend
#
# Restart IDSEA backend:
#   sudo supervisorctl restart idsea-backend
#
# View backend error logs:
#   sudo tail -50 /var/log/idsea/backend.err.log
#
# View backend output logs:
#   sudo tail -50 /var/log/idsea/backend.out.log
#
# Restart Nginx (for ALL sites):
#   sudo systemctl reload nginx
#
# Check all running projects:
#   sudo supervisorctl status
#
# MongoDB shell:
#   mongosh idsea_db
#
# ─────────────────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────
# HOW TO UPDATE IDSEA (after code changes)
# ─────────────────────────────────────────────────────────────
#
# cd /var/www/idsea
# sudo git pull origin main
#
# # If backend changed:
# cd backend
# source venv/bin/activate
# pip install -r requirements.txt
# deactivate
# sudo supervisorctl restart idsea-backend
#
# # If frontend changed:
# cd /var/www/idsea/frontend
# yarn install
# yarn build
# sudo systemctl reload nginx
#
# ─────────────────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────
# TROUBLESHOOTING
# ─────────────────────────────────────────────────────────────
#
# PROBLEM: Website shows "502 Bad Gateway"
# FIX: Backend is not running. Check:
#   sudo supervisorctl status idsea-backend
#   sudo tail -30 /var/log/idsea/backend.err.log
#   sudo supervisorctl restart idsea-backend
#
# PROBLEM: Website shows blank page
# FIX: Frontend build is missing. Rebuild:
#   cd /var/www/idsea/frontend && yarn build
#
# PROBLEM: "nginx: [emerg] bind() to 0.0.0.0:80 failed"
# FIX: Another process is using port 80. Check:
#   sudo ss -tlnp | grep :80
#
# PROBLEM: SSL certificate error
# FIX: Re-run certbot:
#   sudo certbot --nginx -d idsea.in -d www.idsea.in
#
# PROBLEM: Can't upload images (413 error)
# FIX: Check nginx client_max_body_size is 25M in config
#
# PROBLEM: Other projects (Animitra/VetMechPharma) stopped working
# FIX: Check nginx config:
#   sudo nginx -t
#   ls -la /etc/nginx/sites-enabled/
#   # Make sure their config files are still there
#   sudo systemctl reload nginx
#
# ─────────────────────────────────────────────────────────────
