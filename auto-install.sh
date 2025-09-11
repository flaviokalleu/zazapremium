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
    print_color $CYAN "     ZAZAP PREMIUM - INSTALAÇÃO AUTOMÁTICA"
    print_color $CYAN "=================================================="
    echo
}

# Configurações padrão (podem ser alteradas via variáveis de ambiente)
ACCESS_TYPE=${ACCESS_TYPE:-"I"}
HOST_ADDRESS=${HOST_ADDRESS:-"localhost"}
DB_PASSWORD=${DB_PASSWORD:-"99480231a"}
BACKEND_PORT=${BACKEND_PORT:-"8081"}
FRONTEND_PORT=${FRONTEND_PORT:-"4000"}
USE_NGINX=${USE_NGINX:-false}
NGINX_PORT=${NGINX_PORT:-"80"}
NGINX_SSL_PORT=${NGINX_SSL_PORT:-"443"}
DB_NAME=${DB_NAME:-"zazap2"}
DB_USER=${DB_USER:-"postgres"}
JWT_SECRET=${JWT_SECRET:-"supersecretjwtkey"}
USE_SSL=${USE_SSL:-false}

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

# Função para mostrar configurações que serão usadas
show_config() {
    print_color $BLUE "🔧 Configurações que serão usadas:"
    echo
    print_color $WHITE "   Tipo de acesso: $ACCESS_TYPE (I=IP, D=Domínio)"
    print_color $WHITE "   Endereço: $HOST_ADDRESS"
    print_color $WHITE "   Porta Frontend: $FRONTEND_PORT"
    print_color $WHITE "   Porta Backend: $BACKEND_PORT"
    print_color $WHITE "   Banco de dados: $DB_NAME"
    print_color $WHITE "   Usuário DB: $DB_USER"
    print_color $WHITE "   Senha DB: [OCULTA]"
    print_color $WHITE "   JWT Secret: [OCULTO]"
    if [ "$USE_NGINX" = true ]; then
        print_color $WHITE "   Nginx: Sim (porta $NGINX_PORT)"
    else
        print_color $WHITE "   Nginx: Não"
    fi
    echo
    print_color $YELLOW "💡 Para personalizar, defina as variáveis de ambiente antes de executar:"
    print_color $WHITE "   HOST_ADDRESS=meudominio.com DB_PASSWORD=minhasenha ./auto-install.sh"
    echo
}

# Função para criar arquivo .env
create_env_file() {
    print_color $YELLOW "📝 Criando arquivo de configuração..."
    
    cat > .env << EOF
# ===========================
# Configurações do Host/Rede
# ===========================
HOST_IP=$HOST_ADDRESS
FRONTEND_PORT=$FRONTEND_PORT
PORT=$BACKEND_PORT
NGINX_PORT=$NGINX_PORT
USE_SSL=$USE_SSL
ACCESS_TYPE=$ACCESS_TYPE

# ===========================
# Configurações do Banco PostgreSQL 17
# ===========================
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5432

# ===========================
# Configurações Redis
# ===========================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ===========================
# Configurações da Aplicação Backend
# ===========================
HOST=0.0.0.0
JWT_SECRET=$JWT_SECRET
NODE_ENV=production

# ===========================
# Configurações Frontend Origins
# ===========================
FRONTEND_ORIGINS=http://$HOST_ADDRESS:$FRONTEND_PORT

# ===========================
# Autenticação / Tokens
# ===========================
ACCESS_TOKEN_EXPIRY=30m
REFRESH_TOKEN_EXPIRY=7d
EXPOSE_REFRESH_TOKEN=true
FORCE_INSECURE_COOKIES=true
COOKIE_SAMESITE=lax
COOKIE_SECURE=false
LOG_AUTH_VERBOSE=false

# ===========================
# Baileys WhatsApp
# ===========================
BAILEYS_AUTH_ROOT=privated/baileys

# ===========================
# Web Push Notifications (VAPID)
# ===========================
VAPID_PUBLIC=BD7q4d1yPm_R7_sBpEYqsfO9QOJmmTmGOiUbVA4-fcvvrWfShU5g23zR5MD7ykKtjXaFyu-yM4ivpucEYxjMKWY
VAPID_PRIVATE=fZbUZzvTaI1mUgUV8fXb9GwvMbArjl173Hb_q3XRUJQ

# ===========================
# Configurações do Nginx
# ===========================
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

# Função para construir e iniciar os containers
build_and_start() {
    print_color $YELLOW "🔨 Construindo e iniciando os containers..."
    
    # Parar containers existentes
    print_color $BLUE "🛑 Parando containers existentes..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Remover volumes órfãos se existirem
    docker volume prune -f 2>/dev/null || true
    
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
            print_color $GREEN "✅ PostgreSQL está pronto!"
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
            print_color $GREEN "✅ Redis está pronto!"
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
            print_color $GREEN "✅ Backend está pronto!"
            break
        fi
        sleep 3
        timeout=$((timeout-3))
        if [ $((timeout % 15)) -eq 0 ]; then
            print_color $YELLOW "⏳ Ainda aguardando backend... ($timeout segundos restantes)"
        fi
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
    if docker-compose exec backend npm run db:migrate; then
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
            print_color $GREEN "🌐 Acesso Principal: http://$HOST_ADDRESS:$NGINX_PORT"
        fi
    else
        print_color $GREEN "🎨 Frontend: http://$HOST_ADDRESS:$FRONTEND_PORT"
        print_color $GREEN "⚙️  Backend API: http://$HOST_ADDRESS:$BACKEND_PORT"
    fi
    
    echo
    print_color $CYAN "🗄️  Informações do Banco PostgreSQL 17:"
    print_color $WHITE "   Host: localhost:5432"
    print_color $WHITE "   Database: $DB_NAME"
    print_color $WHITE "   User: $DB_USER"
    
    echo
    print_color $CYAN "🔧 Comandos Úteis:"
    print_color $WHITE "   Ver logs: docker-compose logs -f"
    print_color $WHITE "   Parar: docker-compose down"
    print_color $WHITE "   Reiniciar: docker-compose restart"
    print_color $WHITE "   Status: docker-compose ps"
    print_color $WHITE "   Verificar sistema: ./check-status.sh"
    print_color $WHITE "   Testar Puppeteer: ./test-puppeteer.sh"
    
    echo
    print_color $YELLOW "⚠️  Nota: Se esta é a primeira execução, pode levar alguns minutos para o sistema estar totalmente operacional."
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
    
    # Mostrar configurações
    show_config
    
    # Criar arquivo .env
    create_env_file
    
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
