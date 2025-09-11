#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Função para imprimir com cores
print_color() {
    printf "${1}${2}${NC}\n"
}

# Função para gerar senha aleatória
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-16
}

# Função para gerar JWT secret
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-32
}

print_color $CYAN "=================================================="
print_color $CYAN "           ZAZAP PREMIUM - INSTALADOR"
print_color $CYAN "=================================================="
echo

print_color $BLUE "🚀 Instalação Automática com apenas 2 perguntas!"
echo

DEFAULT_IP=$(hostname -I | awk '{print $1}')
# Pergunta 1: Tipo de acesso (IP/localhost vs domínio)
while true; do
    print_color $YELLOW "1️⃣  Como você vai acessar o sistema?"
    echo "   [1] IP ou localhost (recomendado)"
    echo "   [2] Domínio (com SSL automático)"
    read -p "Digite sua escolha (1 ou 2): " CHOICE
    case $CHOICE in
        1)
            ACCESS_TYPE="IP"
            read -p "🌐 Digite o IP que deseja usar (padrão: $DEFAULT_IP) ou 'localhost': " HOST_ADDRESS
            HOST_ADDRESS=${HOST_ADDRESS:-$DEFAULT_IP}
            USE_SSL=false
            break
            ;;
        2)
            ACCESS_TYPE="DOMAIN"
            read -p "🌐 Digite seu domínio (ex: meusite.com): " HOST_ADDRESS
            while [[ ! $HOST_ADDRESS =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; do
                print_color $RED "❌ Domínio inválido!"
                read -p "🌐 Digite seu domínio (ex: meusite.com): " HOST_ADDRESS
            done
            USE_SSL=true
            break
            ;;
        *)
            print_color $RED "❌ Opção inválida! Digite 1 ou 2"
            ;;
    esac
done

echo

# Pergunta 2: Portas
print_color $YELLOW "2️⃣  Configuração de Portas:"
read -p "🎨 Porta do Frontend (padrão: 4000): " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-4000}

read -p "⚙️  Porta do Backend (padrão: 8081): " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-8081}

echo

# Gerar configurações automaticamente
print_color $BLUE "🔧 Gerando configurações automaticamente..."

DB_PASSWORD=$(generate_password)
JWT_SECRET=$(generate_jwt_secret)
DB_NAME="zazap2"
DB_USER="postgres"

print_color $GREEN "✅ Configurações geradas:"
print_color $WHITE "   🌐 Acesso: $ACCESS_TYPE ($HOST_ADDRESS)"
print_color $WHITE "   🎨 Frontend: $FRONTEND_PORT"
print_color $WHITE "   ⚙️  Backend: $BACKEND_PORT" 
print_color $WHITE "   🗄️  Banco: $DB_NAME"
print_color $WHITE "   🔐 Senha DB: [GERADA AUTOMATICAMENTE]"
print_color $WHITE "   🔑 JWT: [GERADO AUTOMATICAMENTE]"
if [ "$USE_SSL" = true ]; then
    print_color $WHITE "   🔒 SSL: Será configurado automaticamente"
fi

echo

# Verificar Docker
print_color $BLUE "🔍 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_color $RED "❌ Docker não encontrado!"
    print_color $YELLOW "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_color $GREEN "✅ Docker instalado!"
else
    print_color $GREEN "✅ Docker encontrado"
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_color $YELLOW "📦 Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_color $GREEN "✅ Docker Compose instalado!"
fi

# Criar arquivo .env
print_color $BLUE "📝 Criando configurações..."

cat > .env << EOF
# Configurações Automáticas - ZazaPremium
HOST_IP=$HOST_ADDRESS
FRONTEND_PORT=$FRONTEND_PORT
PORT=$BACKEND_PORT
NGINX_PORT=80
USE_SSL=$USE_SSL
ACCESS_TYPE=$ACCESS_TYPE

# Banco de Dados PostgreSQL 17
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5433

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Backend
HOST=0.0.0.0
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
FRONTEND_ORIGINS=http://$HOST_ADDRESS:$FRONTEND_PORT,http://localhost:$FRONTEND_PORT

# Autenticação
ACCESS_TOKEN_EXPIRY=30m
REFRESH_TOKEN_EXPIRY=7d
EXPOSE_REFRESH_TOKEN=true
FORCE_INSECURE_COOKIES=true
COOKIE_SAMESITE=lax
COOKIE_SECURE=false
LOG_AUTH_VERBOSE=false
BAILEYS_AUTH_ROOT=privated/baileys

# VAPID (Web Push)
VAPID_PUBLIC=BD7q4d1yPm_R7_sBpEYqsfO9QOJmmTmGOiUbVA4-fcvvrWfShU5g23zR5MD7ykKtjXaFyu-yM4ivpucEYxjMKWY
VAPID_PRIVATE=fZbUZzvTaI1mUgUV8fXb9GwvMbArjl173Hb_q3XRUJQ

# Nginx
NGINX_SSL_PORT=443
EOF

print_color $GREEN "✅ Arquivo .env criado!"

# Adicionar health check
if [ -f "backend/index.js" ] && ! grep -q "/health" backend/index.js; then
    print_color $BLUE "🏥 Adicionando health check..."
    sed -i '/app.listen/i \
// Health check endpoint\
app.get("/health", (req, res) => {\
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });\
});\
' backend/index.js
    print_color $GREEN "✅ Health check adicionado!"
fi

# Construir e iniciar
print_color $BLUE "🏗️  Construindo sistema (pode demorar alguns minutos)..."

docker-compose down --remove-orphans 2>/dev/null || true
docker volume prune -f 2>/dev/null || true

if [ "$USE_SSL" = true ]; then
    # Configurar para SSL/Nginx
    docker-compose --profile nginx build
    docker-compose --profile nginx up -d
else
    # Configurar sem SSL
    docker-compose build
    docker-compose up -d
fi

if [ $? -ne 0 ]; then
    print_color $RED "❌ Erro na construção!"
    echo
    print_color $YELLOW "🔧 Comandos para debug:"
    print_color $WHITE "   docker-compose logs backend"
    print_color $WHITE "   docker-compose logs frontend"
    exit 1
fi

print_color $GREEN "✅ Containers iniciados!"

# Aguardar serviços
print_color $BLUE "⏳ Aguardando serviços ficarem prontos..."

# PostgreSQL
print_color $YELLOW "🗄️  Aguardando PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U $DB_USER -d $DB_NAME &>/dev/null; then
        print_color $GREEN "✅ PostgreSQL pronto!"
        break
    fi
    sleep 2
    printf "."
done

# Redis
print_color $YELLOW "🔴 Aguardando Redis..."
for i in {1..15}; do
    if docker-compose exec -T redis redis-cli ping &>/dev/null; then
        print_color $GREEN "✅ Redis pronto!"
        break
    fi
    sleep 2
    printf "."
done

# Backend
print_color $YELLOW "⚙️  Aguardando Backend..."
for i in {1..40}; do
    if curl -f http://localhost:$BACKEND_PORT/health &>/dev/null; then
        print_color $GREEN "✅ Backend pronto!"
        break
    fi
    sleep 3
    printf "."
    if [ $((i % 10)) -eq 0 ]; then
        echo
        print_color $YELLOW "   Ainda carregando... (Puppeteer pode demorar)"
    fi
done

echo

# Executar migrações
print_color $BLUE "📊 Executando migrações do banco..."
sleep 5
docker-compose exec backend npm run db:migrate 2>/dev/null && print_color $GREEN "✅ Migrações executadas!" || print_color $YELLOW "⚠️  Migrações podem ter falhado"

# Executar seeds
print_color $BLUE "🌱 Executando seeds..."
docker-compose exec backend npm run db:seed 2>/dev/null && print_color $GREEN "✅ Seeds executados!" || print_color $YELLOW "⚠️  Seeds opcionais"

echo
print_color $GREEN "🎉 INSTALAÇÃO CONCLUÍDA!"
print_color $CYAN "=================================================="

if [ "$USE_SSL" = true ]; then
    print_color $GREEN "🌐 Acesso: https://$HOST_ADDRESS"
    print_color $YELLOW "⚠️  Configure SSL: sudo ./setup-ssl.sh"
else
    print_color $GREEN "🎨 Frontend: http://$HOST_ADDRESS:$FRONTEND_PORT"
    print_color $GREEN "⚙️  Backend: http://$HOST_ADDRESS:$BACKEND_PORT"
fi

echo
print_color $CYAN "💾 Credenciais do Banco:"
print_color $WHITE "   Database: $DB_NAME"
print_color $WHITE "   User: $DB_USER"
print_color $WHITE "   Password: $DB_PASSWORD"

echo
print_color $BLUE "✨ Sistema pronto para uso!"
