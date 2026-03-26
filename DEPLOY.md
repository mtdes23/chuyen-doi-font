# Deployment Guide - Font Converter Pro

## Quick Deploy Methods

### 1️⃣ Vercel (Recommended - 2 minutes)
```
1. Go to https://vercel.com/new
2. Import from GitHub: mtdes23/chuyen-doi-font
3. Click Deploy ✓
4. Your app is live at: https://chuyen-doi-font.vercel.app
```

### 2️⃣ Self-Host on Linux/Mac Server
```bash
# 1. Clone repo
git clone https://github.com/mtdes23/chuyen-doi-font.git
cd chuyen-doi-font

# 2. Install & build
npm install
npm run build

# 3. Start production server
npm start

# 4. Access at: http://your-server:3000
```

### 3️⃣ Docker Container
```bash
# 1. Build Docker image
docker build -t font-converter .

# 2. Run container
docker run -p 3000:80 font-converter

# 3. Access at: http://localhost:3000
```

### 4️⃣ Docker with Docker Compose
```bash
# Create docker-compose.yml (see below)
docker-compose up -d

# Access at: http://localhost:3000
```

### 5️⃣ Copy to Web Hosting Folder
```bash
# 1. Build locally
npm run build

# 2. Copy these folders to hosting:
#    - .next/
#    - node_modules/
#    - public/
#    - package.json
#    - next.config.ts

# 3. On hosting server, run:
npm install --production
npm start
```

## Environment Variables (Optional)
None required for basic functionality. The app works out of the box!

## Firewall/Port Settings
- Next.js runs on **port 3000** by default
- Make sure port 3000 is not blocked
- Use NGINX/Apache as reverse proxy for port 80

## Updating to Latest Version
```bash
# On your hosting folder:
git pull origin main
npm install
npm run build
npm start
```

## Troubleshooting
- **Port already in use**: `lsof -i :3000` then `kill -9 <PID>`
- **Out of memory**: Ensure server has ≥512MB RAM
- **Slow builds**: Normal first time, ~5-10 seconds
- **Build errors**: Run `npm install` again to refresh dependencies
