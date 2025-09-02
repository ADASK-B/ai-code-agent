# ngrok Docker Container
FROM ngrok/ngrok:alpine

# Copy config
COPY ngrok.yml /etc/ngrok.yml

# Set entrypoint
ENTRYPOINT ["ngrok"]
CMD ["start", "--all", "--config", "/etc/ngrok.yml"]
