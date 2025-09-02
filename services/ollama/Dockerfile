# Ollama Local LLM Service
FROM ollama/ollama:latest

# Set working directory
WORKDIR /app

# Create a startup script
COPY start-ollama.sh /app/start-ollama.sh
RUN chmod +x /app/start-ollama.sh

# Expose Ollama port
EXPOSE 11434

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:11434/api/tags || exit 1

# Start Ollama service
ENTRYPOINT ["/app/start-ollama.sh"]
