#!/bin/bash
# Model Download Script for Local LLM Container

echo "🤖 Setting up Local LLM Models..."

# Wait for Ollama to be ready
until curl -s http://localhost:11434/api/tags > /dev/null; do
  echo "Waiting for Ollama to start..."
  sleep 2
done

# Download recommended models for code generation
echo "📥 Downloading CodeQwen 7B (Recommended for coding)..."
ollama pull codeqwen:7b

echo "📥 Downloading CodeLlama 7B (Alternative)..."
ollama pull codellama:7b

echo "📥 Downloading Llama 3.1 8B (General purpose)..."
ollama pull llama3.1:8b

echo "✅ Models ready!"
echo "🔗 API available at: http://localhost:11434"

# List available models
echo "📋 Available models:"
ollama list
