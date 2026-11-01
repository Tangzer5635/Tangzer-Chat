#!/bin/sh
# Génère un certificat auto-signé au premier démarrage si aucun n'est fourni.
#
# Le HTTPS est indispensable pour les appels : les navigateurs n'autorisent
# le micro et la caméra qu'en contexte sécurisé (HTTPS ou localhost).
# Pour un certificat reconnu par le navigateur, déposez tangzer.crt et
# tangzer.key (par exemple générés avec mkcert) dans le dossier ./certs.
set -e

CERT_DIR=/etc/nginx/certs

if [ -f "$CERT_DIR/tangzer.crt" ] && [ -f "$CERT_DIR/tangzer.key" ]; then
    exit 0
fi

mkdir -p "$CERT_DIR"

SAN="DNS:localhost,IP:127.0.0.1"
if [ -n "$TLS_EXTRA_SAN" ]; then
    SAN="$SAN,$TLS_EXTRA_SAN"
fi

echo "Tangzer : génération d'un certificat auto-signé ($SAN)"

openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
    -keyout "$CERT_DIR/tangzer.key" \
    -out "$CERT_DIR/tangzer.crt" \
    -subj "/CN=tangzer" \
    -addext "subjectAltName=$SAN" 2>/dev/null
