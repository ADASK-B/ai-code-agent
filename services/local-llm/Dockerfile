# Local LLM Service mit Ollama
FROM ollama/ollama:latest

# Set environment
ENV OLLAMA_HOST=0.0.0.0:11434
ENV OLLAMA_MODELS=/usr/share/ollama/.ollama/models

# Create model directory
RUN mkdir -p /usr/share/ollama/.ollama/models

# Expose API port
EXPOSE 11434

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:11434/api/tags || exit 1

# Default command
CMD ["serve"]
