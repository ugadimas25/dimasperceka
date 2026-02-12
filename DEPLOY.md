# Deployment Guide — dimasperceka.com

## Repository

```
https://github.com/ugadimas25/dimasperceka.git
```

## Prerequisites

- **Node.js** ≥ 20.19.0 atau ≥ 22.12.0
- **npm** ≥ 9
- **Git**

---

## 1. Clone / Pull di Server

```bash
# Clone pertama kali
git clone https://github.com/ugadimas25/dimasperceka.git
cd dimasperceka

# Atau pull update
cd dimasperceka
git pull origin main
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Build Production

```bash
npm run build
```

Output:
- `dist/index.cjs` — Server bundle (Express + API)
- `dist/public/` — Static frontend (Vite build)

## 4. Run Production

```bash
# Default port 5173
npm start

# Custom port
PORT=3000 npm start
```

Server melayani API + static frontend dari satu port.

---

## Deployment dengan PM2

```bash
# Install PM2 global
npm install -g pm2

# Start aplikasi
PORT=3000 pm2 start dist/index.cjs --name "cv-showcase"

# Monitoring
pm2 status
pm2 logs cv-showcase

# Auto-restart saat reboot
pm2 startup
pm2 save
```

### Update Deployment

```bash
cd dimasperceka
git pull origin main
npm install
npm run build
pm2 restart cv-showcase
```

---

## Nginx Reverse Proxy (Opsional)

```nginx
server {
    listen 80;
    server_name dimasperceka.com www.dimasperceka.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Aktifkan & Reload Nginx

```bash
sudo ln -s /etc/nginx/sites-available/dimasperceka /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL dengan Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dimasperceka.com -d www.dimasperceka.com
```

---

## Quick Deploy Script

Simpan sebagai `deploy.sh` di server:

```bash
#!/bin/bash
set -e

cd ~/dimasperceka
echo ">>> Pulling latest code..."
git pull origin main

echo ">>> Installing dependencies..."
npm install

echo ">>> Building production..."
npm run build

echo ">>> Restarting PM2..."
pm2 restart cv-showcase

echo "✓ Deploy complete!"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Struktur Build

```
dist/
├── index.cjs          # Server (Express + API routes + seed data)
└── public/            # Frontend static files (Vite build)
    ├── index.html
    ├── assets/        # JS/CSS bundles
    └── profile_photo.png
```

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend   | Express.js, In-memory storage     |
| Maps      | MapLibre GL JS                    |
| Charts    | Recharts                          |
| Email     | EmailJS (client-side)             |
| Routing   | Wouter (client), Express (server) |

## Port Default

| Environment | Port |
|-------------|------|
| Development | 5173 |
| Production  | 5173 (override with `PORT` env var) |
