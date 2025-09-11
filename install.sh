#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_color() {
    printf "${1}${2}${NC}\n"
}

# Função para imprimir cabeçalho
print_header() {
    echo
    print_color $CYAN "=================================================="
    print_color $CYAN "           ZAZAP PREMIUM - AUTO INSTALLER"
    print_color $CYAN "=================================================="
    echo
}

# Função para verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_color $RED "❌ Docker não está instalado!"
        print_color $YELLOW "📦 Instalando Docker..."
        
        # Detectar sistema operacional
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            print_color $RED "Por favor, instale o Docker Desktop para macOS em: https://docs.docker.com/desktop/mac/install/"
            exit 1
        else
            print_color $RED "Sistema operacional não suportado para instalação automática do Docker"
            exit 1
        fi
    else
        print_color $GREEN "✅ Docker está instalado"
    fi
}

# Função para verificar se Docker Compose está instalado
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_color $RED "❌ Docker Compose não está instalado!"
        print_color $YELLOW "📦 Instalando Docker Compose..."
        
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    else
        print_color $GREEN "✅ Docker Compose está instalado"
    fi
}

# Função para validar IP
validate_ip() {
    local ip=$1
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Função para validar porta
validate_port() {
    local port=$1
    if [[ $port =~ ^[0-9]+$ ]] && [ $port -ge 1 ] && [ $port -le 65535 ]; then
        return 0
    else
        return 1
    fi
}

# Função para coletar configurações do usuário
collect_config() {
    print_color $BLUE "🔧 Configuração do Sistema"
    echo
    
    # Tipo de acesso (IP ou Domínio)
    while true; do
        echo "🌐 Como você vai acessar o sistema?"
        echo "I = IP"
        echo "D = Domínio"
        read -p "Digite sua escolha (I/D): " ACCESS_TYPE
        ACCESS_TYPE=${ACCESS_TYPE^^} # converter para maiúsculo
        
        if [[ $ACCESS_TYPE =~ ^(I|D)$ ]]; then
            break
        else
            print_color $RED "❌ Opção inválida! Digite 'I' para IP ou 'D' para Domínio"
        fi
    done
    
    # IP ou Domínio
    if [ "$ACCESS_TYPE" = "I" ]; then
        while true; do
            read -p "🌐 Digite o IP do servidor (ou 'localhost' para local): " HOST_ADDRESS
            if [ "$HOST_ADDRESS" = "localhost" ] || validate_ip "$HOST_ADDRESS"; then
                USE_SSL=false
                break
            else
                print_color $RED "❌ IP inválido! Use um IP válido ou 'localhost'"
            fi
        done
    else
        while true; do
            read -p "🌐 Digite o domínio (ex: meusite.com): " HOST_ADDRESS
            if [[ $HOST_ADDRESS =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]] || [[ $HOST_ADDRESS =~ ^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$ ]]; then
                USE_SSL=true
                print_color $GREEN "✅ SSL será configurado automaticamente para o domínio"
                break
            else
                print_color $RED "❌ Domínio inválido! Use um formato válido como 'exemplo.com'"
            fi
        done
    fi
    
    # Senha do banco de dados
    echo
    print_color $BLUE "🗄️  Configuração do Banco de Dados PostgreSQL 17"
    while true; do
        read -s -p "🔐 Digite a senha do banco de dados (mínimo 8 caracteres): " DB_PASSWORD
        echo
        if [ ${#DB_PASSWORD} -ge 8 ]; then
            break
        else
            print_color $RED "❌ A senha deve ter pelo menos 8 caracteres!"
        fi
    done
    
    # Porta do Backend
    while true; do
        read -p "⚙️  Digite a porta do Backend (padrão: 8081): " BACKEND_PORT
        BACKEND_PORT=${BACKEND_PORT:-8081}
        if validate_port "$BACKEND_PORT"; then
            break
        else
            print_color $RED "❌ Porta inválida! Use uma porta entre 1 e 65535"
        fi
    done
    
    # Porta do Frontend
    while true; do
        read -p "🎨 Digite a porta do Frontend (padrão: 4000): " FRONTEND_PORT
        FRONTEND_PORT=${FRONTEND_PORT:-4000}
        if validate_port "$FRONTEND_PORT" && [ "$FRONTEND_PORT" != "$BACKEND_PORT" ]; then
            break
        else
            if [ "$FRONTEND_PORT" = "$BACKEND_PORT" ]; then
                print_color $RED "❌ A porta do Frontend deve ser diferente da porta do Backend!"
            else
                print_color $RED "❌ Porta inválida! Use uma porta entre 1 e 65535"
            fi
        fi
    done
    
    # Configurar SSL se for domínio
    if [ "$USE_SSL" = true ]; then
        NGINX_PORT=80
        NGINX_SSL_PORT=443
        print_color $GREEN "🔒 SSL será configurado automaticamente na porta 443"
        USE_NGINX=true
    else
        # Usar Nginx como proxy reverso?
        echo
        read -p "🔄 Deseja usar Nginx como proxy reverso? (s/N): " USE_NGINX_INPUT
        USE_NGINX_INPUT=${USE_NGINX_INPUT,,} # converter para minúsculo
        
        if [[ $USE_NGINX_INPUT =~ ^(s|sim|y|yes)$ ]]; then
            while true; do
                read -p "🌐 Digite a porta do Nginx (padrão: 80): " NGINX_PORT
                NGINX_PORT=${NGINX_PORT:-80}
                if validate_port "$NGINX_PORT" && [ "$NGINX_PORT" != "$FRONTEND_PORT" ] && [ "$NGINX_PORT" != "$BACKEND_PORT" ]; then
                    break
                else
                    print_color $RED "❌ A porta do Nginx deve ser diferente das outras portas!"
                fi
            done
            USE_NGINX=true
            NGINX_SSL_PORT=443
        else
            USE_NGINX=false
        fi
    fi
    
    # Configurações adicionais do banco de dados
    read -p "📊 Nome do banco de dados (padrão: zazap2): " DB_NAME
    DB_NAME=${DB_NAME:-zazap2}
    
    read -p "👤 Usuário do banco (padrão: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    # JWT Secret
    read -p "🔑 JWT Secret (padrão: supersecretjwtkey): " JWT_SECRET
    JWT_SECRET=${JWT_SECRET:-supersecretjwtkey}
}

# Função para criar arquivo .env
create_env_file() {
    print_color $YELLOW "📝 Criando arquivo de configuração..."
    
    cat > .env << EOF
# Configurações do Host
HOST_IP=$HOST_ADDRESS
FRONTEND_PORT=$FRONTEND_PORT
PORT=$BACKEND_PORT
HOST=0.0.0.0
USE_SSL=$USE_SSL
ACCESS_TYPE=$ACCESS_TYPE

# Frontend Origins
FRONTEND_ORIGINS=http://$HOST_ADDRESS:$FRONTEND_PORT

# Configurações do Banco de Dados PostgreSQL 17
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Configurações da Aplicação
JWT_SECRET=$JWT_SECRET
NODE_ENV=production

# Autenticação / Tokens
ACCESS_TOKEN_EXPIRY=30m
REFRESH_TOKEN_EXPIRY=7d
EXPOSE_REFRESH_TOKEN=true
FORCE_INSECURE_COOKIES=true
COOKIE_SAMESITE=lax
COOKIE_SECURE=false
LOG_AUTH_VERBOSE=false

# Baileys Auth Root
BAILEYS_AUTH_ROOT=privated/baileys

# VAPID Keys (Web Push)
VAPID_PUBLIC=BD7q4d1yPm_R7_sBpEYqsfO9QOJmmTmGOiUbVA4-fcvvrWfShU5g23zR5MD7ykKtjXaFyu-yM4ivpucEYxjMKWY
VAPID_PRIVATE=fZbUZzvTaI1mUgUV8fXb9GwvMbArjl173Hb_q3XRUJQ

# Configurações do Nginx
NGINX_PORT=$NGINX_PORT
NGINX_SSL_PORT=$NGINX_SSL_PORT
EOF
    
    print_color $GREEN "✅ Arquivo .env criado com sucesso!"
}

# Função para adicionar endpoint de health check no backend
add_health_endpoint() {
    if [ -f "backend/index.js" ]; then
        if ! grep -q "/health" backend/index.js; then
            print_color $YELLOW "🏥 Adicionando endpoint de health check..."
            
            # Adicionar endpoint de health check antes da última linha
            sed -i '/app.listen/i \
// Health check endpoint\
app.get("/health", (req, res) => {\
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });\
});\
' backend/index.js
            
            print_color $GREEN "✅ Endpoint de health check adicionado!"
        fi
    fi
}

# Função para configurar SSL com Let's Encrypt
setup_ssl() {
    if [ "$USE_SSL" = true ]; then
        print_color $YELLOW "🔒 Configurando SSL para o domínio $HOST_ADDRESS..."
        
        # Criar diretório para certificados SSL
        mkdir -p nginx/ssl
        
        # Criar configuração SSL do Nginx
        cat > nginx/nginx-ssl.conf << EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Log format
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                   '\$status \$body_bytes_sent "\$http_referer" '
                   '"\$http_user_agent" "\$http_x_forwarded_for"';

    # Logs
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;

    # Upstream servers
    upstream backend {
        server zazap_backend:8081;
    }

    upstream frontend {
        server zazap_frontend:80;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name $HOST_ADDRESS;
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name $HOST_ADDRESS;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # API Backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            
            # Timeout settings
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Socket.IO
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Login rate limiting
        location ~ ^/(api/)?auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # File uploads
        location ~ ^/(api/)?uploads/ {
            client_max_body_size 100M;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Timeout for large files
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
        }
    }
}
EOF
        
        print_color $GREEN "✅ Configuração SSL criada!"
        print_color $YELLOW "⚠️  IMPORTANTE: Você precisará configurar os certificados SSL manualmente!"
        print_color $BLUE "📋 Para obter certificados SSL gratuitos com Let's Encrypt:"
        echo "   1. Instale certbot: sudo apt install certbot"
        echo "   2. Obtenha certificados: sudo certbot certonly --standalone -d $HOST_ADDRESS"
        echo "   3. Copie os certificados para nginx/ssl/"
        echo "   4. Reinicie os containers: docker-compose restart"
    fi
}

# Função para construir e iniciar os containers
build_and_start() {
    print_color $YELLOW "🔨 Construindo e iniciando os containers..."
    
    # Parar containers existentes
    print_color $BLUE "🛑 Parando containers existentes..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Remover volumes órfãos se existirem
    docker volume prune -f 2>/dev/null || true
    
    # Configurar SSL se necessário
    if [ "$USE_SSL" = true ]; then
        setup_ssl
        # Usar configuração SSL do nginx
        if [ -f "nginx/nginx-ssl.conf" ]; then
            cp nginx/nginx-ssl.conf nginx/nginx.conf
        fi
    fi
    
    # Construir imagens
    print_color $BLUE "🏗️  Construindo imagens Docker..."
    if [ "$USE_NGINX" = true ]; then
        docker-compose --profile nginx build
    else
        docker-compose build
    fi
    
    if [ $? -ne 0 ]; then
        print_color $RED "❌ Erro ao construir as imagens!"
        exit 1
    fi
    
    # Iniciar containers
    print_color $BLUE "🚀 Iniciando containers..."
    if [ "$USE_NGINX" = true ]; then
        docker-compose --profile nginx up -d
    else
        docker-compose up -d
    fi
    
    if [ $? -ne 0 ]; then
        print_color $RED "❌ Erro ao iniciar os containers!"
        exit 1
    fi
    
    print_color $GREEN "✅ Containers iniciados com sucesso!"
}

# Função para aguardar serviços estarem prontos
wait_for_services() {
    print_color $YELLOW "⏳ Aguardando serviços ficarem prontos..."
    
    # Aguardar PostgreSQL
    print_color $BLUE "🗄️  Aguardando PostgreSQL..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose exec -T postgres pg_isready -U $DB_USER -d $DB_NAME &>/dev/null; then
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    # Aguardar Redis
    print_color $BLUE "🔴 Aguardando Redis..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if docker-compose exec -T redis redis-cli ping &>/dev/null; then
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    # Aguardar Backend (pode demorar mais devido ao Puppeteer)
    print_color $BLUE "⚙️  Aguardando Backend (pode demorar devido ao Puppeteer)..."
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:$BACKEND_PORT/health &>/dev/null; then
            break
        fi
        sleep 3
        timeout=$((timeout-3))
    done
    
    if [ $timeout -le 0 ]; then
        print_color $YELLOW "⚠️  Backend demorou para responder, mas pode estar funcionando"
        print_color $BLUE "📋 Verifique os logs: docker-compose logs backend"
    fi
}

# Função para executar migrações do banco
run_migrations() {
    print_color $YELLOW "📊 Executando migrações do banco de dados..."
    
    # Aguardar um pouco mais para garantir que o backend está totalmente pronto
    sleep 10
    
    # Executar migrações
    docker-compose exec backend npm run db:migrate
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✅ Migrações executadas com sucesso!"
        
        # Executar seeds se existirem
        print_color $YELLOW "🌱 Executando seeds..."
        docker-compose exec backend npm run db:seed 2>/dev/null || true
    else
        print_color $YELLOW "⚠️  Migrações podem ter falhado, mas o sistema pode funcionar normalmente"
    fi
}

# Função para mostrar informações finais
show_final_info() {
    print_color $GREEN "🎉 Instalação concluída com sucesso!"
    echo
    print_color $CYAN "📋 Informações de Acesso:"
    echo
    
    if [ "$USE_NGINX" = true ]; then
        if [ "$USE_SSL" = true ]; then
            print_color $GREEN "🌐 Acesso Principal: https://$HOST_ADDRESS"
            print_color $YELLOW "⚠️  Lembre-se de configurar os certificados SSL!"
        else
            if [ "$HOST_ADDRESS" = "localhost" ]; then
                print_color $GREEN "🌐 Acesso Principal: http://localhost:$NGINX_PORT"
            else
                print_color $GREEN "🌐 Acesso Principal: http://$HOST_ADDRESS:$NGINX_PORT"
            fi
        fi
    else
        if [ "$HOST_ADDRESS" = "localhost" ]; then
            print_color $GREEN "🎨 Frontend: http://localhost:$FRONTEND_PORT"
            print_color $GREEN "⚙️  Backend API: http://localhost:$BACKEND_PORT"
        else
            print_color $GREEN "🎨 Frontend: http://$HOST_ADDRESS:$FRONTEND_PORT"
            print_color $GREEN "⚙️  Backend API: http://$HOST_ADDRESS:$BACKEND_PORT"
        fi
    fi
    
    echo
    print_color $CYAN "🗄️  Informações do Banco PostgreSQL 17:"
    print_color $WHITE "   Host: localhost:5432"
    print_color $WHITE "   Database: $DB_NAME"
    print_color $WHITE "   User: $DB_USER"
    print_color $WHITE "   Password: $DB_PASSWORD"
    
    if [ "$USE_SSL" = true ]; then
        echo
        print_color $CYAN "� Configuração SSL:"
        print_color $YELLOW "   Para configurar SSL com Let's Encrypt:"
        print_color $WHITE "   1. sudo apt install certbot"
        print_color $WHITE "   2. sudo certbot certonly --standalone -d $HOST_ADDRESS"
        print_color $WHITE "   3. sudo cp /etc/letsencrypt/live/$HOST_ADDRESS/fullchain.pem nginx/ssl/"
        print_color $WHITE "   4. sudo cp /etc/letsencrypt/live/$HOST_ADDRESS/privkey.pem nginx/ssl/"
        print_color $WHITE "   5. docker-compose restart nginx"
    fi
    
    echo
    print_color $CYAN "�🔧 Comandos Úteis:"
    print_color $WHITE "   Ver logs: docker-compose logs -f"
    print_color $WHITE "   Parar: docker-compose down"
    print_color $WHITE "   Reiniciar: docker-compose restart"
    print_color $WHITE "   Status: docker-compose ps"
    
    echo
    print_color $YELLOW "⚠️  Nota: Se esta é a primeira execução, pode levar alguns minutos para o sistema estar totalmente operacional."
    
    if [ "$ACCESS_TYPE" = "D" ]; then
        echo
        print_color $BLUE "🌐 Para domínio, certifique-se de que:"
        print_color $WHITE "   - O DNS do domínio $HOST_ADDRESS aponta para este servidor"
        print_color $WHITE "   - As portas 80 e 443 estão abertas no firewall"
        print_color $WHITE "   - Os certificados SSL estão configurados corretamente"
    fi
}

# Função para verificar se já existe uma instalação
check_existing_installation() {
    if [ -f ".env" ] && [ -f "docker-compose.yml" ]; then
        echo
        print_color $YELLOW "⚠️  Uma instalação existente foi detectada!"
        read -p "Deseja sobrescrever a configuração existente? (s/N): " OVERWRITE
        OVERWRITE=${OVERWRITE,,}
        
        if [[ ! $OVERWRITE =~ ^(s|sim|y|yes)$ ]]; then
            print_color $BLUE "Usando configuração existente..."
            return 1
        fi
    fi
    return 0
}

# Função para verificar pré-requisitos
check_prerequisites() {
    print_color $BLUE "🔍 Verificando pré-requisitos..."
    
    # Verificar se está no diretório correto
    if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
        print_color $RED "❌ Execute este script no diretório raiz do projeto ZazaPremium!"
        exit 1
    fi
    
    # Verificar Docker
    check_docker
    check_docker_compose
    
    print_color $GREEN "✅ Todos os pré-requisitos atendidos!"
}

# Função principal
main() {
    print_header
    
    # Verificar pré-requisitos
    check_prerequisites
    
    # Verificar instalação existente
    if check_existing_installation; then
        # Coletar configurações
        collect_config
        
        # Criar arquivo .env
        create_env_file
    else
        # Carregar configurações existentes
        source .env 2>/dev/null || true
    fi
    
    # Adicionar health endpoint
    add_health_endpoint
    
    # Construir e iniciar
    build_and_start
    
    # Aguardar serviços
    wait_for_services
    
    # Executar migrações
    run_migrations
    
    # Mostrar informações finais
    show_final_info
}

# Tratamento de erros
trap 'print_color $RED "❌ Erro durante a instalação! Verifique os logs e tente novamente."; exit 1' ERR

# Executar função principal
main
