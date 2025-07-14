# Nosana Builders Challenge: Agent-101

![Agent-101](./assets/NosanaBuildersChallengeAgents.jpg)

## Topic

Nosana Builders Challenge, 2nd edition
Agent-101: Build your first agent

## Description

The main goal of this `Nosana Builders Challenge` to teach participants to build and deploy agents. This first step will be in running a basic AI agent and giving it some basic functionality. Participants will add a tool, for the tool calling capabilities of the agent. These are basically some TypeScript functions, that will, for example, retrieve some data from a weather API, post a tweet via an API call, etc.

## [Mastra](https://github.com/mastra-ai/mastra)

For this challenge we will be using Mastra to build our tool.

> Mastra is an opinionated TypeScript framework that helps you build AI applications and features quickly. It gives you the set of primitives you need: workflows, agents, RAG, integrations, and evals. You can run Mastra on your local machine, or deploy to a serverless cloud.

### Required Reading

We recommend reading the following sections to get started with how to create an Agent and how to implement Tool Calling.

- <https://mastra.ai/en/docs/agents/overview>
- [Mastra Guide: Build an AI stock agent](https://mastra.ai/en/guides/guide/stock-agent)

## Get Started

To get started run the following command to start developing:
We recommend using [pnpm](https://pnpm.io/installation), but you can try npm, or bun if you prefer.

```sh
pnpm install
pnpm run dev
```

## Trading Bot Agent

This section details the Trading Bot agent created for the Nosana Builders Challenge.

### Agent Description and Purpose

The Trading Bot is an advanced AI-powered trading assistant that implements a sophisticated trend-following strategy using real-time market data and multiple technical indicators. Built with the Mastra framework, this agent provides intelligent market analysis and trade execution capabilities.

**Core Features:**
- **Real-time Market Data**: Integrates with CoinGecko API to fetch live cryptocurrency prices, market cap, volume, and price changes
- **Technical Analysis**: Calculates EMA (50 & 200), RSI, and MACD indicators from real market data
- **Trend Detection**: Identifies market trends (uptrend, downtrend, sideways) using multiple confirmation signals
- **Automated Trading**: Executes buy/sell orders based on clear trend signals and confidence levels
- **Risk Management**: Implements dynamic stop-loss (5%) and take-profit (10%) mechanisms
- **Position Sizing**: Adjusts position size based on signal confidence and market volatility

**Supported Trading Pairs:**
- BTC/USD, BTC/USDT (Bitcoin)
- ETH/USD, ETH/USDT (Ethereum) 
- SOL/USD, SOL/USDT (Solana)
- ADA/USD, ADA/USDT (Cardano)
- MATIC/USD, MATIC/USDT (Polygon)

**Trading Strategy:**
- **Uptrend Detection**: Price above EMAs, RSI 50-80, positive MACD histogram, positive 7-day change
- **Downtrend Detection**: Price below EMAs, RSI 20-50, negative MACD histogram, negative 7-day change
- **Signal Confidence**: High (5+ confirmations), Medium (4 confirmations), Low (<4 confirmations)
- **Risk Management**: Dynamic position sizing based on confidence levels and market volatility

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Shradhesh71/agent-challenge.git
   cd agent-challenge
   ```

2. **Install dependencies:**
   This project uses `pnpm` for package management, but also supports `npm` and `bun`.
   ```bash
   pnpm install
   # or
   npm install
   # or
   bun install
   ```

3. **Set up the LLM endpoint:**
   You have two options for running the LLM:

   **Option A: Local Ollama (Recommended for development)**
   - [Install Ollama](https://ollama.com/download)
   - Start the Ollama service:
     ```bash
     ollama serve
     ```
   - Pull and run the model:
     ```bash
     ollama pull qwen2.5:1.5b
     ollama run qwen2.5:1.5b
     ```

   **Option B: Use Nosana endpoint**
   - Use the provided Nosana endpoint for testing (see Environment Variables section)

4. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Update the variables according to your chosen LLM endpoint.

5. **Start the development server:**
   ```bash
   pnpm run dev
   ```
   The Mastra playground will be available at `http://localhost:8080`

6. **Access the Trading Bot:**
   - Open your browser to `http://localhost:8080`
   - Select "Trading Bot" from the agent dropdown
   - Start interacting with your trading assistant!

### Environment Variables Required

Create a `.env` file in the project root with the following variables:

```env
# Local Ollama Configuration (Default - Recommended for development)
API_BASE_URL=http://localhost:11434/v1
MODEL_NAME_AT_ENDPOINT=qwen2.5:1.5b

# CoinGecko API Key for Real-time Market Data
CRYPTO_API_KEY=CG-demo-api-key

# Alternative: Nosana Network Endpoint (for testing on Nosana)
# API_BASE_URL=https://dashboard.nosana.com/jobs/GPVMUckqjKR6FwqnxDeDRqbn34BH7gAa5xWnWuNH1drf
# MODEL_NAME_AT_ENDPOINT=qwen2.5:1.5b

# Optional: For production with larger models
# API_BASE_URL=http://localhost:11434/v1
# MODEL_NAME_AT_ENDPOINT=qwen2.5:32b
```

**Environment Variable Descriptions:**
- `API_BASE_URL`: The base URL of your LLM API endpoint (OpenAI-compatible format)
- `MODEL_NAME_AT_ENDPOINT`: The specific model name to use for the trading bot
- `CRYPTO_API_KEY`: Your CoinGecko API key for real-time cryptocurrency data (get free key at [CoinGecko API](https://www.coingecko.com/en/api))

**Getting a CoinGecko API Key:**
1. Visit [CoinGecko API](https://www.coingecko.com/en/api) 
2. Sign up for a free account
3. Generate your API key in the dashboard
4. Add it to your `.env` file as `CRYPTO_API_KEY`

**Model Recommendations:**
- **Development**: `qwen2.5:1.5b` - Lightweight, fast, good for testing
- **Production**: `qwen2.5:32b` - More capable for complex trading decisions
- **Custom**: Any OpenAI-compatible model endpoint

### Docker Build and Run Commands

The Trading Bot is containerized for easy deployment on Nosana or any Docker-compatible platform.

**Build Commands:**
```bash
# Build the Docker image
docker build -t shradesh71/agent-challenge:latest .

# Optional: Build with a specific tag
docker build -t shradesh71/agent-challenge:v1.0.0 .
```

**Local Testing:**
```bash
# Run the container locally with environment variables
docker run -p 8080:8080 --env-file .env shradesh71/agent-challenge:latest

# Or run with inline environment variables
docker run -p 8080:8080 \
  -e API_BASE_URL=http://localhost:11434/v1 \
  -e MODEL_NAME_AT_ENDPOINT=qwen2.5:1.5b \
  shradesh71/agent-challenge:latest
```

**Publishing to Registry:**
```bash
# Login to Docker Hub
docker login

# Push the image
docker push shradesh71/agent-challenge:latest

# Or push with specific tag
docker push shradesh71/agent-challenge:v1.0.0
```

**Production Deployment:**
```bash
# Deploy on Nosana using the CLI
pnpm run deploy:agent

# Or manually deploy using Nosana job definition
nosana job post --file ./nos_job_def/nosana_mastra.json --market nvidia-3090 --timeout 30
```

**Testing the Container:**
After starting the container, visit `http://localhost:8080` to access the Trading Bot interface.

### Example Usage

Once your Trading Bot is running, you can interact with it through the Mastra playground at `http://localhost:8080`.

**Getting Started:**
1. Select "Trading Bot" from the agent dropdown menu
2. Start chatting with your trading assistant

**Example Conversations:**

**Real-time Market Analysis:**
```
User: "Analyze the current Bitcoin market"
Bot: "Fetching real-time BTC data from CoinGecko...
Current Price: $67,500
24h Change: +2.3%
7d Change: +8.5%
RSI: 62.5 (Bullish momentum)
MACD: Positive histogram (Bullish signal)
Trend: UPTREND with HIGH confidence
Recommendation: BUY with stop-loss at $64,125 and take-profit at $74,250"
```

**Multi-Asset Analysis:**
```
User: "Compare BTC, ETH, and SOL right now"
Bot: "Analyzing multiple assets with real-time data...
BTC: $67,500 (+2.3%) - UPTREND - BUY signal
ETH: $2,450 (+1.8%) - UPTREND - BUY signal  
SOL: $145 (-0.5%) - SIDEWAYS - HOLD signal
Best opportunity: BTC with highest confidence score"
```

**Trading Execution:**
```
User: "Execute a buy order for ETH with $1000"
Bot: "Analyzing ETH/USD... 
Current Price: $2,450
Signal: BUY with MEDIUM confidence
Executing trade:
- Amount: $1000 (0.61 ETH)
- Entry: $2,450
- Stop Loss: $2,327.50 (-5%)
- Take Profit: $2,695 (+10%)
- Position Size: 60% (Medium confidence)
Trade executed successfully!"
```

**Risk Management:**
```
User: "What's my risk on the current BTC position?"
Bot: "Current BTC Position Analysis:
- Entry Price: $65,000
- Current Price: $67,500 (+3.8%)
- Stop Loss: $61,750 (-5% from entry)
- Take Profit: $71,500 (+10% from entry)
- Unrealized P&L: +$250 
- Risk Level: LOW (price trending upward)"
```

**Technical Analysis Deep Dive:**
```
User: "Explain the current MACD signals for Bitcoin"
Bot: "Bitcoin MACD Analysis (Real-time data):
- MACD Line: +125.5
- Signal Line: +89.2  
- Histogram: +36.3 (Bullish)
- The MACD line crossed above signal line 3 days ago
- Histogram is expanding, indicating strengthening bullish momentum
- This aligns with current uptrend confirmation"
```

**Features Demonstrated:**
- ✅ **Real-time market data** from CoinGecko API
- ✅ **Live price feeds** with 24h and 7d changes  
- ✅ **Dynamic technical indicators** calculated from real data
- ✅ **Multi-asset comparison** and analysis
- ✅ **Confidence-based position sizing** and risk management
- ✅ **Educational explanations** of technical analysis concepts

**Note:** The Trading Bot uses real market data from CoinGecko API for analysis but simulates trade execution for demonstration purposes. In a production environment, you would integrate with real exchange APIs for actual trade execution.

### LLM-Endpoint

Agents depend on an LLM to be able to do their work.

#### Nosana Endpoint

You can use the following endpoint and model for testing, if you wish:

```
MODEL_NAME_AT_ENDPOINT=qwen2.5:1.5b
API_BASE_URL= https://dashboard.nosana.com/jobs/GPVMUckqjKR6FwqnxDeDRqbn34BH7gAa5xWnWuNH1drf
```

#### Running Your Own LLM with Ollama

The default configuration uses a local [Ollama](https://ollama.com) LLM.
For local development or if you prefer to use your own LLM, you can use [Ollama](https://ollama.ai) to serve the lightweight `qwen2.5:1.5b` mode.

**Installation & Setup:**

1. **[ Install Ollama ](https://ollama.com/download)**:

2. **Start Ollama service**:

```bash
ollama serve
```

3. **Pull and run the `qwen2.5:1.5b` model**:

```bash
ollama pull qwen2.5:1.5b
ollama run qwen2.5:1.5b
```

4. **Update your `.env` file**

There are two predefined environments defined in the `.env` file. One for local development and another, with a larger model, `qwen2.5:32b`, for more complex use cases.

**Why `qwen2.5:1.5b`?**

- Lightweight (only ~1GB)
- Fast inference on CPU
- Supports tool calling
- Great for development and testing

Do note `qwen2.5:1.5b` is not suited for complex tasks.

The Ollama server will run on `http://localhost:11434` by default and is compatible with the OpenAI API format that Mastra expects.

