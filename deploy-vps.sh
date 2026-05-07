#!/bin/bash
# ============================================================
# deploy-vps.sh — Actualización YellowFleet en VPS
# Ubuntu 22.04 | PostgreSQL 14 | Node 20 | Sin Docker
# ============================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

APP_DIR="/var/www/yellowfleet/yellowfleet"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
BACKUP_FILE="/tmp/yellowfleet_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "========================================================"
echo "  YellowFleet — Despliegue $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================================"

# ── 1. Backup DB ─────────────────────────────────────────────
info "Respaldando base de datos..."
sudo -u postgres pg_dump yellowfleet_db > "$BACKUP_FILE" 2>/dev/null || \
  PGPASSWORD=yf123 pg_dump -U yf_user -h localhost yellowfleet_db > "$BACKUP_FILE"
info "Backup: $BACKUP_FILE ($(du -sh $BACKUP_FILE | cut -f1))"

# ── 2. Detener backend ────────────────────────────────────────
info "Deteniendo backend..."
pm2 stop yellowfleet-backend 2>/dev/null || true
pkill -f "node.*dist/index" 2>/dev/null || true
sleep 1

# ── 3. Git pull ───────────────────────────────────────────────
info "Actualizando código..."
cd "$APP_DIR"
git fetch origin
git reset --hard origin/main
info "Código: $(git log --oneline -1)"

# ── 4. Backend: dependencias + build ─────────────────────────
info "Instalando dependencias del backend..."
cd "$BACKEND_DIR"
npm install --prefer-offline 2>/dev/null || npm install

info "Generando Prisma Client..."
npx prisma generate

info "Ejecutando migraciones..."
npx prisma migrate deploy 2>&1 || {
  warn "migrate deploy falló — intentando baseline..."
  # Baseline de todas las migraciones existentes si no hay historial
  npx prisma migrate resolve --applied "20260217215435_init" 2>/dev/null || true
  npx prisma migrate resolve --applied "20260217232342_make_machine_fields_optional" 2>/dev/null || true
  npx prisma migrate resolve --applied "20260219013645_add_work_order_logs" 2>/dev/null || true
  npx prisma migrate resolve --applied "20260219162406_add_user" 2>/dev/null || true
  npx prisma migrate resolve --applied "20260219183208_add_machine_image" 2>/dev/null || true
  npx prisma migrate resolve --applied "20260219221226_add_hour_meter_log" 2>/dev/null || true
  npx prisma migrate resolve --applied "20260220000000_add_roles_and_permissions" 2>/dev/null || true
  npx prisma migrate resolve --applied "20260220013751_add_file_fields_to_workorderlog" 2>/dev/null || true
  npx prisma migrate resolve --applied "20260220015335_add_legal_documents" 2>/dev/null || true
  npx prisma migrate resolve --applied "20260220023437_add_previous_status" 2>/dev/null || true
  npx prisma migrate deploy
}

info "Compilando backend..."
npm run build

# ── 5. Frontend: build ────────────────────────────────────────
info "Instalando dependencias del frontend..."
cd "$FRONTEND_DIR"
npm install --prefer-offline 2>/dev/null || npm install

info "Compilando frontend..."
npm run build

# ── 6. Nginx ──────────────────────────────────────────────────
info "Actualizando Nginx..."
cat > /etc/nginx/conf.d/yellowfleet.conf << 'NGINX'
server {
    listen 5175;
    server_name _;
    root /var/www/yellowfleet/yellowfleet/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

nginx -t && systemctl reload nginx
info "Nginx OK (puerto 5175)"

# ── 7. PM2 ───────────────────────────────────────────────────
info "Iniciando backend con PM2..."
cd "$BACKEND_DIR"

# Instalar PM2 si no está
command -v pm2 &>/dev/null || npm install -g pm2

pm2 delete yellowfleet-backend 2>/dev/null || true
pm2 start dist/index.js --name yellowfleet-backend
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo" | bash 2>/dev/null || true

# ── 8. Verificación ──────────────────────────────────────────
sleep 4
echo ""
echo "========================================================"
echo "  Verificación"
echo "========================================================"

if pm2 list | grep -q yellowfleet-backend; then
  info "✓ Backend corriendo (PM2)"
else
  error "✗ Backend no está corriendo — revisar: pm2 logs yellowfleet-backend"
fi

if curl -s http://localhost:3000/health > /dev/null 2>&1; then
  info "✓ Health check OK"
else
  warn "⚠ Health check no responde aún (puede tardar)"
fi

if systemctl is-active --quiet nginx; then
  info "✓ Nginx activo"
fi

SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "========================================================"
echo "  Despliegue completado"
echo "  App:    http://$SERVER_IP:5175"
echo "  Backup: $BACKUP_FILE"
echo "========================================================"
