#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_color() {
    printf "${1}${2}${NC}\n"
}

# Função para verificar status de um container
check_container_status() {
    local container_name=$1
    local status=$(docker-compose ps -q $container_name 2>/dev/null)
    
    if [ -n "$status" ]; then
        local running=$(docker inspect -f '{{.State.Running}}' ${status} 2>/dev/null)
        local health=$(docker inspect -f '{{.State.Health.Status}}' ${status} 2>/dev/null)
        
        if [ "$running" = "true" ]; then
            if [ "$health" = "healthy" ] || [ "$health" = "" ]; then
                print_color $GREEN "✅ $container_name: Rodando"
            else
                print_color $YELLOW "⚠️  $container_name: Rodando (Health: $health)"
            fi
        else
            print_color $RED "❌ $container_name: Parado"
        fi
    else
        print_color $RED "❌ $container_name: Não encontrado"
    fi
}

# Função para verificar conectividade
check_connectivity() {
    local url=$1
    local name=$2
    
    if curl -s -f "$url" >/dev/null 2>&1; then
        print_color $GREEN "✅ $name: Acessível"
    else
        print_color $RED "❌ $name: Não acessível"
    fi
}

# Função principal
main() {
    print_color $CYAN "=================================================="
    print_color $CYAN "        VERIFICADOR DE STATUS - ZAZAP PREMIUM"
    print_color $CYAN "=================================================="
    echo
    
    # Verificar se docker-compose.yml existe
    if [ ! -f "docker-compose.yml" ]; then
        print_color $RED "❌ Arquivo docker-compose.yml não encontrado!"
        print_color $YELLOW "Execute o instalador primeiro: ./install.sh"
        exit 1
    fi
    
    # Carregar variáveis de ambiente
    if [ -f ".env" ]; then
        source .env
    else
        print_color $YELLOW "⚠️  Arquivo .env não encontrado, usando valores padrão"
        HOST_IP="localhost"
        FRONTEND_PORT="3000"
        BACKEND_PORT="3001"
    fi
    
    print_color $BLUE "🔍 Verificando status dos containers..."
    echo
    
    # Verificar containers
    check_container_status "postgres"
    check_container_status "redis"
    check_container_status "backend"
    check_container_status "frontend"
    check_container_status "nginx"
    
    echo
    print_color $BLUE "🌐 Verificando conectividade..."
    echo
    
    # Verificar conectividade
    if [ "$HOST_IP" = "localhost" ]; then
        check_connectivity "http://localhost:$BACKEND_PORT/health" "Backend API"
        check_connectivity "http://localhost:$FRONTEND_PORT" "Frontend"
        
        if [ "$USE_SSL" = "true" ]; then
            check_connectivity "https://localhost" "Nginx SSL"
        elif [ "$USE_NGINX" = "true" ]; then
            check_connectivity "http://localhost:$NGINX_PORT" "Nginx"
        fi
    else
        check_connectivity "http://$HOST_IP:$BACKEND_PORT/health" "Backend API"
        check_connectivity "http://$HOST_IP:$FRONTEND_PORT" "Frontend"
        
        if [ "$USE_SSL" = "true" ]; then
            check_connectivity "https://$HOST_IP" "Nginx SSL"
        elif [ "$USE_NGINX" = "true" ]; then
            check_connectivity "http://$HOST_IP:$NGINX_PORT" "Nginx"
        fi
    fi
    
    echo
    print_color $BLUE "🗄️  Verificando banco de dados..."
    echo
    
    # Verificar PostgreSQL
    if docker-compose exec -T postgres pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-zazapremium} >/dev/null 2>&1; then
        print_color $GREEN "✅ PostgreSQL: Conectável"
        
        # Verificar tabelas
        local table_count=$(docker-compose exec -T postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-zazapremium} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        if [ "$table_count" -gt 0 ]; then
            print_color $GREEN "✅ Banco de dados: $table_count tabelas encontradas"
        else
            print_color $YELLOW "⚠️  Banco de dados: Nenhuma tabela encontrada (execute as migrações)"
        fi
    else
        print_color $RED "❌ PostgreSQL: Não conectável"
    fi
    
    # Verificar Redis
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        print_color $GREEN "✅ Redis: Conectável"
    else
        print_color $RED "❌ Redis: Não conectável"
    fi
    
    echo
    print_color $BLUE "📊 Informações do sistema..."
    echo
    
    # Mostrar uso de recursos
    print_color $CYAN "💾 Uso de memória dos containers:"
    docker-compose ps -q | xargs docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || print_color $YELLOW "Não foi possível obter estatísticas"
    
    echo
    print_color $CYAN "💿 Uso de disco dos volumes:"
    docker system df 2>/dev/null || print_color $YELLOW "Não foi possível obter informações de disco"
    
    echo
    print_color $BLUE "🔧 Comandos úteis:"
    print_color $WHITE "   Ver logs: docker-compose logs -f"
    print_color $WHITE "   Reiniciar: docker-compose restart"
    print_color $WHITE "   Status detalhado: docker-compose ps"
    print_color $WHITE "   Verificar novamente: ./check-status.sh"
}

# Executar função principal
main
