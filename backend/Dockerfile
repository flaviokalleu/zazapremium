FROM node:20-alpine

# Instalar dependências do sistema para Puppeteer e aplicação
RUN set -eux; \
        # Try default mirror, then fallback to dl-2 if needed
        for mirror in dl-cdn.alpinelinux.org dl-2.alpinelinux.org; do \
            sed -i "s|https://dl-cdn.alpinelinux.org|https://$mirror|g" /etc/apk/repositories || true; \
            apk update || true; \
            apk add --no-cache \
                chromium \
                nss \
                freetype \
                freetype-dev \
                harfbuzz \
                ca-certificates \
                ttf-freefont \
                ttf-dejavu \
                ttf-droid \
                ttf-liberation \
                curl \
                ffmpeg \
                udev \
                xvfb \
            && break; \
            echo "APK install failed with mirror $mirror, retrying with next..."; \
            sleep 2; \
        done; \
        rm -rf /var/cache/apk/*

# Configurar Puppeteer para usar o Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run --no-zygote --single-process --disable-extensions"

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Copiar node_modules do host (instalado localmente para evitar problemas de rede)
COPY node_modules/ ./node_modules/

# Verificar se as dependências principais estão presentes
RUN ls -la node_modules/express || (echo "Express not found" && exit 1)

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p uploads privated sessions

# Expor porta
EXPOSE 8081

# Adicionar healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

# Criar script de inicialização
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Executando migrações..."' >> /app/start.sh && \
    echo 'npm run db:migrate' >> /app/start.sh && \
    echo 'echo "Executando seeds..."' >> /app/start.sh && \
    echo 'npm run db:seed' >> /app/start.sh && \
    echo 'echo "Iniciando aplicação..."' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Comando para iniciar a aplicação com migrações automáticas
CMD ["/app/start.sh"]
