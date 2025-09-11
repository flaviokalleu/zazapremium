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

# Função para verificar se está executando como root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_color $RED "❌ Este script deve ser executado como root (sudo)"
        exit 1
    fi
}

# Função para instalar certbot
install_certbot() {
    print_color $YELLOW "📦 Instalando Certbot..."
    
    # Atualizar repositórios
    apt update
    
    # Instalar certbot
    apt install -y certbot
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✅ Certbot instalado com sucesso!"
    else
        print_color $RED "❌ Erro ao instalar Certbot"
        exit 1
    fi
}

# Função principal
main() {
    print_color $CYAN "=================================================="
    print_color $CYAN "         CONFIGURADOR SSL - ZAZAP PREMIUM"
    print_color $CYAN "=================================================="
    echo
    
    # Verificar se é root
    check_root
    
    # Ler domínio do arquivo .env
    if [ -f ".env" ]; then
        source .env
        DOMAIN=$HOST_IP
    else
        read -p "🌐 Digite o domínio para configurar SSL: " DOMAIN
    fi
    
    print_color $BLUE "🔒 Configurando SSL para o domínio: $DOMAIN"
    
    # Verificar se certbot está instalado
    if ! command -v certbot &> /dev/null; then
        install_certbot
    fi
    
    # Parar nginx temporariamente para liberar a porta 80
    print_color $YELLOW "🛑 Parando nginx temporariamente..."
    docker-compose stop nginx 2>/dev/null || true
    
    # Obter certificados
    print_color $YELLOW "🔐 Obtendo certificados SSL..."
    certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✅ Certificados SSL obtidos com sucesso!"
        
        # Criar diretório para certificados
        mkdir -p nginx/ssl
        
        # Copiar certificados
        print_color $YELLOW "📋 Copiando certificados..."
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
        cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/
        
        # Definir permissões
        chmod 644 nginx/ssl/fullchain.pem
        chmod 600 nginx/ssl/privkey.pem
        chown $SUDO_USER:$SUDO_USER nginx/ssl/*
        
        # Reiniciar nginx
        print_color $YELLOW "🔄 Reiniciando nginx..."
        docker-compose restart nginx
        
        print_color $GREEN "🎉 SSL configurado com sucesso!"
        print_color $CYAN "🌐 Seu site agora está disponível em: https://$DOMAIN"
        
        # Configurar renovação automática
        print_color $YELLOW "⏰ Configurando renovação automática..."
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'docker-compose restart nginx'") | crontab -
        
        print_color $GREEN "✅ Renovação automática configurada!"
        
    else
        print_color $RED "❌ Erro ao obter certificados SSL"
        print_color $YELLOW "Verifique se:"
        print_color $WHITE "- O domínio $DOMAIN aponta para este servidor"
        print_color $WHITE "- A porta 80 está aberta no firewall"
        print_color $WHITE "- Não há outros serviços usando a porta 80"
        
        # Reiniciar nginx mesmo se falhou
        docker-compose restart nginx 2>/dev/null || true
        exit 1
    fi
}

# Executar função principal
main
