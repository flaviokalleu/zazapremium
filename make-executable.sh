#!/bin/bash

# Tornar todos os scripts executáveis
chmod +x install.sh
chmod +x auto-install.sh
chmod +x quick-install.sh
chmod +x setup-ssl.sh  
chmod +x check-status.sh
chmod +x test-puppeteer.sh

echo "✅ Todos os scripts foram tornados executáveis!"
echo ""
echo "📋 Scripts disponíveis:"
echo "   ./quick-install.sh  - Instalador rápido (2 perguntas apenas!) ⭐"
echo "   ./install.sh        - Instalador interativo completo"
echo "   ./auto-install.sh   - Instalador automático (sem perguntas)"
echo "   ./setup-ssl.sh      - Configurador de SSL (requer sudo)"
echo "   ./check-status.sh   - Verificador de status do sistema"
echo "   ./test-puppeteer.sh - Teste do Puppeteer/Chrome"
echo ""
echo "🚀 Recomendado: ./quick-install.sh"
