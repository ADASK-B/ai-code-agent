#!/bin/sh

# ngrok startup script with environment variable support and error handling

echo "Starting ngrok tunnel..."
echo "Target: gateway:8080 (Direct webhook endpoint)"

# Validate authtoken
if [ -z "$NGROK_AUTHTOKEN" ]; then
    echo "ERROR: NGROK_AUTHTOKEN environment variable is required!"
    echo "Please set NGROK_AUTHTOKEN in your environment or .env file"
    echo "Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    exit 1
fi

echo "Starting ngrok tunnel to gateway:8080..."
echo "Authtoken: ${NGROK_AUTHTOKEN:0:8}..."

# Start ngrok with environment variable
exec ngrok http gateway:8080 \
    --authtoken "$NGROK_AUTHTOKEN" \
    --log stdout \
    --log-level info
