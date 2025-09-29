#!/bin/bash

# Update system
apt-get update
apt-get upgrade -y

# Install dependencies
apt-get install -y \
  curl \
  wget \
  git \
  nodejs \
  npm \
  postgresql-client \
  nginx \
  supervisor

# Install pnpm
npm install -g pnpm

# Create application user
useradd -m -s /bin/bash appuser
usermod -aG sudo appuser

# Create application directory
mkdir -p /opt/app
chown appuser:appuser /opt/app
cd /opt/app

# Clone application (in production, this would be from a private repo)
# sudo -u appuser git clone https://github.com/Pavyniya/jewelry-seo-automation.git .

# Set environment variables
cat > /opt/app/.env << EOF
NODE_ENV=${environment}
DATABASE_URL=postgresql://admin:${database_endpoint}
PORT=3000
LOG_LEVEL=info
ENVIRONMENT=${environment}
EOF

# Install dependencies
sudo -u appuser pnpm install

# Build application
sudo -u appuser pnpm build

# Create systemd service
cat > /etc/systemd/system/jewelry-seo.service << EOF
[Unit]
Description=Jewelry SEO Automation
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/app
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
Environment=NODE_ENV=${environment}
Environment=DATABASE_URL=postgresql://admin:${database_endpoint}

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable jewelry-seo
systemctl start jewelry-seo

# Configure nginx
cat > /etc/nginx/sites-available/jewelry-seo << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable nginx site
ln -s /etc/nginx/sites-available/jewelry-seo /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and restart nginx
nginx -t
systemctl restart nginx