#!/bin/sh
# Replace environment variable in config
sed "s/\${NGROK_AUTHTOKEN}/$NGROK_AUTHTOKEN/g" /ngrok.yml > /tmp/ngrok.yml
exec ngrok start --config /tmp/ngrok.yml web
