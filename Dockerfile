FROM node:24-alpine

WORKDIR /app

# Install production dependencies. npm install is used instead of npm ci
# so a slightly stale lockfile does not break the image build.
# su-exec lets the entrypoint drop from root to the node user.
COPY package.json package-lock.json ./
RUN npm install --omit=dev && npm cache clean --force && apk add --no-cache su-exec

# App source
COPY server.mjs store.mjs auth.mjs sso.mjs ./
COPY providers ./providers
COPY public ./public
COPY config.example.json ./config.example.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# The app runs as the unprivileged node user. The entrypoint starts as root only to hand the mounted
# config.json (owned by root on the host) to that user, then drops root before starting the app.

ENV NODE_ENV=production \
    PORT=4123 \
    HOST=0.0.0.0

EXPOSE 4123

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4123/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
