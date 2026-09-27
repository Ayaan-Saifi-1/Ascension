#!/usr/bin/env bash
# ==============================================================================
# Ascension One-Click GCP Ubuntu Deployment Script
# Runs on Ubuntu 22.04 / 24.04 LTS (Google Cloud Compute Engine)
# ==============================================================================
set -e

echo "=================================================="
echo " Starting Ascension Deployment on Google Cloud VM"
echo "=================================================="

# 1. Detect directory & user
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURRENT_USER="$(whoami)"
echo "[+] Application directory: $APP_DIR"
echo "[+] Running as user: $CURRENT_USER"

# 2. System updates & package installation
echo "[+] Updating apt repositories and installing system packages..."
sudo apt-get update -y
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    curl \
    git \
    unzip \
    build-essential

# 3. Ensure Node.js 22 LTS is installed
if ! command -v node &> /dev/null || [[ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]]; then
    echo "[+] Installing Node.js 22 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "[+] Node.js version: $(node -v)"
echo "[+] npm version: $(npm -v)"

# 4. Setup Python Virtual Environment
echo "[+] Setting up Python virtual environment..."
cd "$APP_DIR"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
echo "[+] Installing Python dependencies from backend/requirements.txt..."
pip install -r backend/requirements.txt

# 5. Download model weights if not present
if [ ! -f "ml/models/safetybert/model.safetensors" ]; then
    echo "[+] Downloading SafetyBERT model checkpoint..."
    python scripts/download_model.py
else
    echo "[+] SafetyBERT model checkpoint already present."
fi

# 6. Database migrations & data seeding
echo "[+] Running database migrations and seeding initial data..."
export DEMO_MODE="1"
export DJANGO_SECRET_KEY="local-demo-only-not-for-deployment"
export DJANGO_ALLOWED_HOSTS="*"
export CORS_ALLOW_ALL_ORIGINS="1"
python backend/manage.py setup_deployment

# 7. Frontend installation and production build
echo "[+] Installing frontend dependencies..."
cd "$APP_DIR/frontend"
npm install
echo "[+] Building frontend for production..."
npm run build
cd "$APP_DIR"

# 8. Configure Systemd Service: Backend (Port 9008)
echo "[+] Creating systemd service for Ascension Backend..."
sudo tee /etc/systemd/system/ascension-backend.service > /dev/null <<EOF
[Unit]
Description=Ascension Backend Django API
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$APP_DIR
Environment=DEMO_MODE=1
Environment=DJANGO_SECRET_KEY=local-demo-only-not-for-deployment
Environment=DJANGO_ALLOWED_HOSTS=*
Environment=CORS_ALLOW_ALL_ORIGINS=1
Environment=TORCH_NUM_THREADS=4
ExecStart=$APP_DIR/.venv/bin/python $APP_DIR/backend/manage.py runserver 127.0.0.1:9008 --noreload
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 9. Configure Systemd Service: Frontend (Port 9234)
echo "[+] Creating systemd service for Ascension Frontend..."
NODE_BIN="$(which node)"
NPX_BIN="$(which npx)"
sudo tee /etc/systemd/system/ascension-frontend.service > /dev/null <<EOF
[Unit]
Description=Ascension Frontend Vinext UI
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$APP_DIR/frontend
Environment=PORT=9234
Environment=NODE_ENV=production
ExecStart=$NPX_BIN vinext start --host 127.0.0.1 --port 9234
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 10. Configure Nginx Reverse Proxy on Port 80
echo "[+] Configuring Nginx reverse proxy on port 80..."
sudo tee /etc/nginx/sites-available/ascension > /dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:9008;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Frontend UI proxy
    location / {
        proxy_pass http://127.0.0.1:9234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable Nginx site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/ascension /etc/nginx/sites-enabled/ascension

# 11. Enable & Start All Services
echo "[+] Reloading systemd and starting all services..."
sudo systemctl daemon-reload
sudo systemctl enable ascension-backend.service
sudo systemctl restart ascension-backend.service

sudo systemctl enable ascension-frontend.service
sudo systemctl restart ascension-frontend.service

sudo nginx -t
sudo systemctl restart nginx

# 12. Retrieve Public IP and show final message
EXTERNAL_IP=\$(curl -s -m 5 https://ifconfig.me || curl -s -m 5 https://api.ipify.org || echo "YOUR_VM_EXTERNAL_IP")

echo ""
echo "=========================================================="
echo " [SUCCESS] Ascension is deployed and running!"
echo " Shareable Public Link: http://\$EXTERNAL_IP"
echo "=========================================================="
echo " Backend Status:  sudo systemctl status ascension-backend"
echo " Frontend Status: sudo systemctl status ascension-frontend"
echo " Nginx Status:    sudo systemctl status nginx"
echo " View Backend Logs:  journalctl -u ascension-backend -f"
echo " View Frontend Logs: journalctl -u ascension-frontend -f"
echo "=========================================================="
