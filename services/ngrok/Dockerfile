FROM ngrok/ngrok:latest
COPY --chmod=755 entrypoint.sh /entrypoint.sh
COPY ngrok.yml /ngrok.yml
ENTRYPOINT ["/entrypoint.sh"]
