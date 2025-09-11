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

# Função principal
main() {
    print_color $CYAN "=================================================="
    print_color $CYAN "         TESTE PUPPETEER - ZAZAP PREMIUM"
    print_color $CYAN "=================================================="
    echo
    
    # Verificar se o backend está rodando
    if ! docker-compose ps backend | grep -q "Up"; then
        print_color $RED "❌ Backend não está rodando!"
        print_color $YELLOW "Execute: docker-compose up -d backend"
        exit 1
    fi
    
    print_color $BLUE "🚀 Testando Puppeteer no container backend..."
    
    # Criar script de teste temporário
    cat > test_puppeteer.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('🚀 Iniciando Puppeteer...');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions'
      ]
    });
    
    console.log('✅ Browser iniciado com sucesso!');
    
    const page = await browser.newPage();
    console.log('✅ Nova página criada!');
    
    await page.goto('https://example.com');
    console.log('✅ Página carregada!');
    
    const title = await page.title();
    console.log(`✅ Título da página: ${title}`);
    
    await browser.close();
    console.log('✅ Browser fechado!');
    
    console.log('\n🎉 Teste do Puppeteer concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste do Puppeteer:', error.message);
    process.exit(1);
  }
})();
EOF
    
    # Copiar script para o container e executar
    docker-compose exec -T backend sh -c "cat > /tmp/test_puppeteer.js" < test_puppeteer.js
    
    print_color $YELLOW "⏳ Executando teste (pode demorar alguns segundos)..."
    
    if docker-compose exec backend node /tmp/test_puppeteer.js; then
        print_color $GREEN "🎉 Puppeteer está funcionando corretamente!"
    else
        print_color $RED "❌ Erro no teste do Puppeteer"
        print_color $YELLOW "📋 Verificando logs do container..."
        docker-compose logs --tail=20 backend
    fi
    
    # Limpar arquivo temporário
    rm -f test_puppeteer.js
    docker-compose exec backend rm -f /tmp/test_puppeteer.js 2>/dev/null || true
    
    echo
    print_color $BLUE "🔧 Se houver problemas, tente:"
    print_color $WHITE "   docker-compose restart backend"
    print_color $WHITE "   docker-compose logs backend"
}

# Executar função principal
main
