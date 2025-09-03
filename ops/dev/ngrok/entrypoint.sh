#!/bin/sh

# Replace environment variable in ngrok.yml template using sed
sed "s/\${NGROK_AUTHTOKEN}/$NGROK_AUTHTOKEN/g" /etc/ngrok.yml.template > /etc/ngrok.yml

# Start ngrok
exec ngrok start --all --config /etc/ngrok.yml
