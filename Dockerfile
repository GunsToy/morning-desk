FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY server.mjs ./
COPY public ./public
COPY config.example.json ./config.example.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chmod +x /app/docker-entrypoint.sh && \
    chown -R nodejs:nodejs /app

USER nodejs

ENV NODE_ENV=production \
    PORT=4123 \
    HOST=0.0.0.0

EXPOSE 4123

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4123/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
