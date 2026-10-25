FROM node:24-alpine

WORKDIR /app

# Install production dependencies. npm install is used instead of npm ci
# so a slightly stale lockfile does not break the image build.
COPY package.json package-lock.json ./
RUN npm install --omit=dev && npm cache clean --force

# App source
COPY server.mjs store.mjs auth.mjs ./
COPY providers ./providers
COPY public ./public
COPY config.example.json ./config.example.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Run as root so the mounted config.json stays writable.
# (Homelab dashboard; the volume is typically owned by root on the host.)

ENV NODE_ENV=production \
    PORT=4123 \
    HOST=0.0.0.0

EXPOSE 4123

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4123/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
