#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

print_color() {
    printf "${1}${2}${NC}\n"
}

print_color $CYAN "🔧 Verificando e liberando portas..."

# Verificar e parar PostgreSQL local
if sudo systemctl is-active --quiet postgresql 2>/dev/null; then
    print_color $YELLOW "🛑 Parando PostgreSQL local..."
    sudo systemctl stop postgresql
    print_color $GREEN "✅ PostgreSQL local parado"
fi

# Verificar porta 5432
if netstat -tulpn 2>/dev/null | grep -q ":5432 "; then
    print_color $YELLOW "🔍 Porta 5432 ainda em uso, tentando liberar..."
    sudo pkill -f postgres 2>/dev/null || true
    sleep 2
fi

# Verificar porta 4000
if netstat -tulpn 2>/dev/null | grep -q ":4000 "; then
    print_color $YELLOW "🔍 Porta 4000 em uso, liberando..."
    sudo lsof -ti:4000 | xargs sudo kill -9 2>/dev/null || true
fi

# Verificar porta 8081
if netstat -tulpn 2>/dev/null | grep -q ":8081 "; then
    print_color $YELLOW "🔍 Porta 8081 em uso, liberando..."
    sudo lsof -ti:8081 | xargs sudo kill -9 2>/dev/null || true
fi

# Verificar porta 6379 (Redis)
if netstat -tulpn 2>/dev/null | grep -q ":6379 "; then
    print_color $YELLOW "🔍 Porta 6379 em uso, liberando..."
    sudo lsof -ti:6379 | xargs sudo kill -9 2>/dev/null || true
fi

# Limpar containers Docker órfãos
print_color $BLUE "🧹 Limpando containers órfãos..."
docker-compose down --remove-orphans 2>/dev/null || true
docker container prune -f 2>/dev/null || true

print_color $GREEN "✅ Portas liberadas! Agora execute o instalador:"
print_color $WHITE "   ./quick-install.sh"
