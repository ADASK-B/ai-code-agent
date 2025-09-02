FROM mcr.microsoft.com/azure-storage/azurite:latest

# Create data directory
RUN mkdir -p /data

# Expose ports for Blob, Queue, and Table services
EXPOSE 10000 10001 10002

# Start Azurite with debugging and CORS enabled
CMD ["azurite", "--silent", "--location", "/data", "--debug", "/data/debug.log", "--blobHost", "0.0.0.0", "--queueHost", "0.0.0.0", "--tableHost", "0.0.0.0"]
