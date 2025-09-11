FROM node:20-alpine AS base

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
        PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
        PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run --no-zygote --single-process --disable-extensions"

WORKDIR /app

# Instala dependências do sistema necessárias para chromium/ffmpeg
RUN set -eux; \
        for mirror in dl-cdn.alpinelinux.org dl-2.alpinelinux.org; do \
            sed -i "s|https://dl-cdn.alpinelinux.org|https://$mirror|g" /etc/apk/repositories || true; \
            apk update || true; \
            apk add --no-cache chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont ttf-dejavu ttf-droid ttf-liberation curl ffmpeg udev xvfb bash; \
            break; \
        done; \
        rm -rf /var/cache/apk/*

# Copia package.json para instalar dependências
COPY package*.json ./

# Instala dependências em camada separada (produção)
RUN npm ci --omit=dev || npm install --production --no-optional --legacy-peer-deps

# Copia código fonte
COPY . .

# Garantir diretórios necessários
RUN mkdir -p uploads privated sessions

# Healthcheck script
RUN echo '#!/bin/sh' > /healthcheck.sh \ 
 && echo 'curl -f http://localhost:8081/health || exit 1' >> /healthcheck.sh \ 
 && chmod +x /healthcheck.sh

EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 CMD /healthcheck.sh

# Script de start com migrations + seeds idempotentes
RUN echo '#!/bin/sh' > /app/start.sh \ 
 && echo 'set -e' >> /app/start.sh \ 
 && echo 'echo "[Start] Executando migrations"' >> /app/start.sh \ 
 && echo 'npm run db:migrate || true' >> /app/start.sh \ 
 && echo 'echo "[Start] Executando seeds"' >> /app/start.sh \ 
 && echo 'npm run db:seed || true' >> /app/start.sh \ 
 && echo 'echo "[Start] Iniciando aplicação"' >> /app/start.sh \ 
 && echo 'exec npm start' >> /app/start.sh \ 
 && chmod +x /app/start.sh

CMD ["/app/start.sh"]
