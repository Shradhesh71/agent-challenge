# Trading Bot Docker Image
FROM ollama/ollama:0.7.0

# Environment variables for Ollama and API
ENV API_BASE_URL=http://127.0.0.1:11434/v1
ENV MODEL_NAME_AT_ENDPOINT=qwen2.5:1.5b
ENV NODE_ENV=production
ENV PORT=8080

# Labels for better documentation
LABEL maintainer="shradesh71"
LABEL description="AI-powered cryptocurrency trading bot with real-time market analysis"
LABEL version="1.0.0"

# Qwen2.5:1.5b - Docker (Default)
# ENV MODEL_NAME_AT_ENDPOINT=qwen2.5:1.5b

# Qwen2.5:32b - Docker (Uncomment for larger model)
# ENV MODEL_NAME_AT_ENDPOINT=qwen2.5:32b

# Install system dependencies and Node.js
RUN apt-get update && apt-get install -y \
  curl \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files
COPY .env.docker package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Build the project
RUN pnpm run build

# Override the default entrypoint
ENTRYPOINT ["/bin/sh", "-c"]

# Start Ollama service and pull the model, then run the app
CMD ["ollama serve & sleep 5 && ollama pull ${MODEL_NAME_AT_ENDPOINT} && node .mastra/output/index.mjs"]
