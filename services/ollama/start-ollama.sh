#!/bin/bash

# Start Ollama service in background
ollama serve &

# Wait for Ollama to be ready
echo "Waiting for Ollama to start..."
sleep 10

echo "Ollama should be ready, pulling model..."

# Pull a small, fast model for code generation
# CodeGemma is good for code tasks and relatively small
ollama pull codegemma:2b

echo "Model pulled successfully!"

# Keep container running
wait
