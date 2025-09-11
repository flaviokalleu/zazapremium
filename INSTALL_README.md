# 🚀 ZazaPremium - Auto Instalador Docker

Sistema completo de auto instalação para o ZazaPremium usando Docker com PostgreSQL 17.

## 📋 Pré-requisitos

- Linux (Ubuntu/Debian recomendado)
- Acesso root/sudo
- Conexão com internet

## 🔧 Instalação Rápida

### 1. Clone o repositório ou baixe os arquivos

```bash
git clone <seu-repositorio>
cd zazapremium
```

### 2. Execute o instalador

```bash
chmod +x install.sh
./install.sh
```

### 3. Responda às perguntas do instalador

O instalador fará as seguintes perguntas:

1. **Tipo de acesso**: 
   - `I` = IP (para acesso via IP)
   - `D` = Domínio (para acesso via domínio com SSL)

2. **IP ou Domínio**:
   - Se escolheu IP: digite o IP do servidor ou `localhost`
   - Se escolheu Domínio: digite o domínio (ex: `meusite.com`)

3. **Senha do banco de dados**: Mínimo 8 caracteres (padrão: 99480231a)

4. **Porta do Backend**: Padrão 8081

5. **Porta do Frontend**: Padrão 3000

## 🌐 Configuração por Domínio (SSL)

Se você escolheu acesso por domínio, após a instalação inicial:

### 1. Configure o DNS
Certifique-se de que seu domínio aponta para o IP do servidor.

### 2. Configure SSL automaticamente
```bash
sudo ./setup-ssl.sh
```

Este script irá:
- Instalar o Certbot
- Obter certificados SSL gratuitos do Let's Encrypt
- Configurar renovação automática
- Reiniciar o Nginx com SSL ativo

## 📁 Estrutura dos Arquivos

```
zazapremium/
├── install.sh              # Script principal de instalação
├── setup-ssl.sh           # Script para configurar SSL
├── docker-compose.yml     # Configuração dos containers
├── .env                   # Variáveis de ambiente (criado automaticamente)
├── backend/
│   ├── Dockerfile         # Imagem Docker do backend
│   └── ...
├── frontend/
│   ├── Dockerfile         # Imagem Docker do frontend
│   ├── nginx.conf         # Configuração do Nginx para frontend
│   └── ...
└── nginx/
    ├── nginx.conf         # Configuração do proxy reverso
    ├── nginx-ssl.conf     # Configuração SSL (criado automaticamente)
    └── ssl/               # Certificados SSL
```

## 🗄️ Banco de Dados

- **PostgreSQL 17** (Alpine)
- Configuração automática
- Migrações executadas automaticamente
- Seeds opcionais

## 🤖 Puppeteer & Chrome

O sistema inclui suporte completo ao Puppeteer com Chromium:

- **Chromium** instalado automaticamente no container
- Configurado para executar em modo headless
- Otimizado para containers Docker
- Suporte a fontes e renderização adequada

### Configurações do Puppeteer
O sistema está configurado com:
- `--no-sandbox` - Para execução em containers
- `--disable-setuid-sandbox` - Segurança em containers
- `--disable-dev-shm-usage` - Uso otimizado de memória
- `--disable-gpu` - Modo headless
- `--single-process` - Estabilidade em containers

## 🔧 Comandos Úteis

### Ver logs dos containers
```bash
docker-compose logs -f
```

### Ver logs de um serviço específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Parar todos os serviços
```bash
docker-compose down
```

### Reiniciar todos os serviços
```bash
docker-compose restart
```

### Ver status dos containers
```bash
docker-compose ps
```

### Executar comando no backend
```bash
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
```

### Testar Puppeteer
```bash
./test-puppeteer.sh
```

### Backup do banco de dados
```bash
docker-compose exec postgres pg_dump -U postgres zazapremium > backup.sql
```

### Restaurar backup
```bash
docker-compose exec -T postgres psql -U postgres zazapremium < backup.sql
```

## 🔒 Configuração SSL Manual

Se preferir configurar SSL manualmente:

### 1. Obter certificados
```bash
sudo certbot certonly --standalone -d seudominio.com
```

### 2. Copiar certificados
```bash
sudo cp /etc/letsencrypt/live/seudominio.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/seudominio.com/privkey.pem nginx/ssl/
sudo chown $USER:$USER nginx/ssl/*
```

### 3. Reiniciar Nginx
```bash
docker-compose restart nginx
```

## 🚨 Solução de Problemas

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs nome_do_container

# Verificar se as portas estão em uso
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Verificar logs do PostgreSQL
docker-compose logs postgres

# Testar conexão
docker-compose exec postgres psql -U postgres -d zazapremium -c "SELECT 1;"
```

### Problemas com SSL
```bash
# Verificar certificados
sudo certbot certificates

# Testar configuração do Nginx
docker-compose exec nginx nginx -t

# Renovar certificados manualmente
sudo certbot renew
```

### Problemas com Puppeteer/Chrome
```bash
# Testar Puppeteer especificamente
./test-puppeteer.sh

# Verificar se Chrome está instalado no container
docker-compose exec backend which chromium-browser

# Verificar logs específicos do Puppeteer
docker-compose logs backend | grep -i puppeteer

# Verificar dependências do Chrome
docker-compose exec backend ldd /usr/bin/chromium-browser
```

### Reset completo
```bash
# Parar e remover tudo
docker-compose down -v
docker system prune -f

# Remover arquivo de configuração
rm .env

# Executar instalador novamente
./install.sh
```

## 🔧 Configurações Avançadas

### Variáveis de Ambiente (.env)

Você pode editar o arquivo `.env` para personalizar:

```bash
# Configurações do Host
HOST_IP=seu.dominio.com
FRONTEND_PORT=3000
PORT=8081
HOST=0.0.0.0

# Banco de dados
DB_NAME=zazap2
DB_USER=postgres
DB_PASS=sua_senha_segura

# JWT e Autenticação
JWT_SECRET=seu_jwt_secret_super_seguro
ACCESS_TOKEN_EXPIRY=30m
REFRESH_TOKEN_EXPIRY=7d

# Web Push (VAPID)
VAPID_PUBLIC=sua_chave_publica_vapid
VAPID_PRIVATE=sua_chave_privada_vapid
```

### Nginx Personalizado

Para personalizar o Nginx, edite:
- `nginx/nginx.conf` - Configuração sem SSL
- `nginx/nginx-ssl.conf` - Configuração com SSL

### Recursos dos Containers

Para limitar recursos, adicione ao `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs -f`
2. Verifique o status: `docker-compose ps`
3. Teste conectividade: `curl http://localhost:3001/health`

## 🔄 Atualizações

Para atualizar o sistema:

```bash
# Pull das últimas imagens
docker-compose pull

# Rebuildar se necessário
docker-compose build

# Reiniciar com novas imagens
docker-compose up -d
```
