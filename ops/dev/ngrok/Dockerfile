# ngrok Docker Container
FROM ngrok/ngrok:alpine

# Copy config template
COPY ngrok.yml.template /tmp/ngrok.yml.template

# Use sh to process template at runtime
ENTRYPOINT ["sh", "-c", "sed \"s/\\${NGROK_AUTHTOKEN}/$NGROK_AUTHTOKEN/g\" /tmp/ngrok.yml.template > /tmp/ngrok.yml && ngrok start --all --config /tmp/ngrok.yml"]
