# ---- Build du front React ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---- nginx : sert le front et relaie /api et /ws vers le backend ----
# Image Debian : elle contient déjà openssl pour générer le certificat HTTPS.
FROM nginx:1.27

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-generate-cert.sh /docker-entrypoint.d/40-generate-cert.sh
RUN chmod +x /docker-entrypoint.d/40-generate-cert.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443
