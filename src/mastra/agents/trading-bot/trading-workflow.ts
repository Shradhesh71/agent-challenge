import { Agent } from "@mastra/core/agent";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { model } from "../../config";

const agent = new Agent({
    name: "Trading Strategy Agent",
    model,
    instructions: `You are an expert trading analyst who excels at trend following strategies.
    When analyzing market data, always prioritize risk management and clear signals.
    
    For each analysis, provide:
    1. Clear trend direction and strength
    2. Key technical indicators (MA, RSI, MACD)
    3. Entry and exit points with rationale
    4. Risk management parameters (stop-loss, position size)
    5. Confidence level in the signal
    
    NEVER recommend trades without:
    - Clear trend confirmation
    - Defined stop-loss levels
    - Risk-reward ratio > 2
    - Multiple technical confirmations
    
    Format responses as:
    
    MARKET ANALYSIS FOR [SYMBOL]
    ===========================
    • TREND: [Up/Down/Sideways]
    • STRENGTH: [Strong/Moderate/Weak]
    • TIMEFRAME: [Selected timeframe]
    
    TECHNICAL SIGNALS
    ================
    • Moving Averages: [Status]
    • RSI: [Value + Interpretation]
    • MACD: [Signal + Direction]
    • Volume: [Analysis]
    
    TRADE RECOMMENDATION
    ===================
    • Action: [Buy/Sell/Hold]
    • Entry Price: [Price]
    • Stop Loss: [Price]
    • Take Profit: [Price]
    • Position Size: [%]
    • Confidence: [High/Medium/Low]
    
    RISK ASSESSMENT
    ==============
    • R:R Ratio: [Value]
    • Max Loss: [%]
    • Market Risk Level: [Low/Medium/High]
    
    Always explain your reasoning and highlight key risks.
    `
});

// Define the schemas
const MarketInputSchema = z.object({
    symbol: z.string().describe("Trading pair to analyze"),
    timeframe: z.enum(["1h", "4h", "1d"]).optional(),
    portfolio: z.number().optional().describe("Portfolio size for position sizing calculations")
});

const MarketOutputSchema = z.object({
    symbol: z.string(),
    trend: z.enum(["uptrend", "downtrend", "sideways"]),
    confidence: z.enum(["high", "medium", "low"]),
    action: z.enum(["buy", "sell", "hold"]),
    price: z.number(),
    stopLoss: z.number(),
    takeProfit: z.number(),
    positionSize: z.number()
});

const TradeInputSchema = z.object({
    symbol: z.string(),
    action: z.enum(["buy", "sell"]),
    price: z.number(),
    stopLoss: z.number(),
    takeProfit: z.number(),
    positionSize: z.number()
});

const TradeOutputSchema = z.object({
    success: z.boolean(),
    orderId: z.string().optional(),
    error: z.string().optional()
});

const MonitorInputSchema = z.object({
    symbol: z.string(),
    orderId: z.string(),
    entryPrice: z.number(),
    stopLoss: z.number(),
    takeProfit: z.number()
});

const MonitorOutputSchema = z.object({
    status: z.enum(["open", "closed", "partially_closed"]),
    currentPrice: z.number(),
    unrealizedPnL: z.number(),
    action: z.enum(["hold", "close", "adjust_stop_loss"]).optional(),
    newStopLoss: z.number().optional()
});

type MarketOutput = z.infer<typeof MarketOutputSchema>;
type MonitorOutput = z.infer<typeof MonitorOutputSchema>;

// Environment variable for API key (add to .env file)
const CRYPTO_KEY = process.env.CRYPTO_API_KEY || "CG-demo-api-key";

// Helper function to map symbol to CoinGecko coin ID
const getCoinGeckoId = (symbol: string): string => {
    const mapping: Record<string, string> = {
        "BTC/USD": "bitcoin",
        "BTC/USDT": "bitcoin",
        "ETH/USD": "ethereum",
        "ETH/USDT": "ethereum",
        "SOL/USD": "solana",
        "SOL/USDT": "solana",
        "ADA/USD": "cardano",
        "ADA/USDT": "cardano",
        "MATIC/USD": "matic-network",
        "MATIC/USDT": "matic-network"
    };
    return mapping[symbol.toUpperCase()] || "bitcoin";
};

// Helper function to fetch real market data
const fetchMarketData = async (symbol: string) => {
    try {
        const coinName = getCoinGeckoId(symbol);
        const url = `https://api.coingecko.com/api/v3/coins/${coinName}?x_cg_demo_api_key=${CRYPTO_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching market data:", error);
        // Fallback to mock data if API fails
        return null;
    }
};

// Helper function to calculate technical indicators from price data
const calculateTechnicalIndicators = (marketData: any) => {
    const currentPrice = marketData?.market_data?.current_price?.usd || 50000;
    const priceChange24h = marketData?.market_data?.price_change_percentage_24h || 0;
    const priceChange7d = marketData?.market_data?.price_change_percentage_7d || 0;
    const marketCap = marketData?.market_data?.market_cap?.usd || 1000000000;
    const volume24h = marketData?.market_data?.total_volume?.usd || 10000000;
    
    // Simple EMA calculation (mock values based on price movements)
    const ema50 = currentPrice * (1 + (priceChange7d / 100) * 0.3);
    const ema200 = currentPrice * (1 + (priceChange7d / 100) * 0.1);
    
    // RSI calculation (simplified based on recent price changes)
    let rsi = 50; // neutral
    if (priceChange24h > 5) rsi = 70; // overbought
    else if (priceChange24h > 0) rsi = 55 + (priceChange24h * 2);
    else if (priceChange24h < -5) rsi = 30; // oversold
    else rsi = 45 + priceChange24h;
    
    // MACD calculation (simplified)
    const macdLine = (currentPrice - ema50) / currentPrice * 100;
    const signalLine = macdLine * 0.8;
    const histogram = macdLine - signalLine;
    
    return {
        currentPrice,
        priceChange24h,
        priceChange7d,
        marketCap,
        volume24h,
        ema50,
        ema200,
        rsi: Math.max(0, Math.min(100, rsi)),
        macd: { macdLine, signalLine, histogram }
    };
};

// Helper function to determine trend and generate trading signals
const analyzeMarketTrend = (indicators: any, symbol: string) => {
    const { currentPrice, ema50, ema200, rsi, macd, priceChange24h, priceChange7d } = indicators;
    
    // Trend Analysis
    let trend: "uptrend" | "downtrend" | "sideways" = "sideways";
    let confidence: "high" | "medium" | "low" = "low";
    let action: "buy" | "sell" | "hold" = "hold";
    
    // Bullish signals
    const bullishSignals = [
        currentPrice > ema50,
        currentPrice > ema200,
        ema50 > ema200,
        rsi > 50 && rsi < 80,
        macd.histogram > 0,
        priceChange7d > 0
    ].filter(Boolean).length;
    
    // Bearish signals
    const bearishSignals = [
        currentPrice < ema50,
        currentPrice < ema200,
        ema50 < ema200,
        rsi < 50 && rsi > 20,
        macd.histogram < 0,
        priceChange7d < 0
    ].filter(Boolean).length;
    
    // Determine trend and action
    if (bullishSignals >= 4) {
        trend = "uptrend";
        action = "buy";
        confidence = bullishSignals >= 5 ? "high" : "medium";
    } else if (bearishSignals >= 4) {
        trend = "downtrend";
        action = "sell";
        confidence = bearishSignals >= 5 ? "high" : "medium";
    } else {
        trend = "sideways";
        action = "hold";
        confidence = "low";
    }
    
    // Risk management - calculate stop loss and take profit
    const stopLossPercent = 0.05; // 5%
    const takeProfitPercent = 0.10; // 10%
    
    const stopLoss = action === "buy" 
        ? currentPrice * (1 - stopLossPercent)
        : currentPrice * (1 + stopLossPercent);
    
    const takeProfit = action === "buy"
        ? currentPrice * (1 + takeProfitPercent)
        : currentPrice * (1 - takeProfitPercent);
    
    // Position sizing based on confidence and volatility
    let positionSize = 0.5; // default 50% of available capital
    if (confidence === "high") positionSize = 0.8;
    else if (confidence === "medium") positionSize = 0.6;
    else positionSize = 0.3;
    
    return {
        symbol,
        trend,
        confidence,
        action,
        price: currentPrice,
        stopLoss,
        takeProfit,
        positionSize,
        analysis: {
            bullishSignals,
            bearishSignals,
            rsi,
            macdSignal: macd.histogram > 0 ? "bullish" : "bearish",
            priceChange24h,
            priceChange7d,
            recommendation: `${action.toUpperCase()} signal with ${confidence} confidence. Price: $${currentPrice.toFixed(2)}, RSI: ${rsi.toFixed(1)}, Trend: ${trend}`
        }
    };
};

// Step 1: Market Analysis with Real API Data
const analyzeMarket = createStep({
    id: "analyze-market",
    description: "Analyze market conditions using real-time CoinGecko data and generate trading signals",
    inputSchema: MarketInputSchema,
    outputSchema: MarketOutputSchema,
    execute: async ({ inputData }) => {
        if (!inputData) throw new Error("Input data not found");
        
        console.log(`Fetching real-time data for ${inputData.symbol}...`);
        
        // Fetch real market data from CoinGecko API
        const marketData = await fetchMarketData(inputData.symbol);
        
        // Calculate technical indicators
        const indicators = calculateTechnicalIndicators(marketData);
        
        // Analyze trend and generate signals
        const analysis = analyzeMarketTrend(indicators, inputData.symbol);
        
        console.log(`Analysis complete for ${inputData.symbol}:`, analysis.analysis);
        
        return {
            symbol: analysis.symbol,
            trend: analysis.trend,
            confidence: analysis.confidence,
            action: analysis.action,
            price: analysis.price,
            stopLoss: analysis.stopLoss,
            takeProfit: analysis.takeProfit,
            positionSize: analysis.positionSize
        } as MarketOutput;
    }
});

// This will be the data structure passed through the workflow
const TradingDecisionSchema = z.object({
    tradeable: z.boolean(),
    tradeDetails: TradeInputSchema.optional(),
    tradeResult: TradeOutputSchema.optional(),
    monitorResult: MonitorOutputSchema.optional()
});
type TradingDecision = z.infer<typeof TradingDecisionSchema>;


// Step 2: Decide and Prepare Trade
const prepareTrade = createStep({
    id: "prepare-trade",
    description: "Decides if a trade should be made and prepares details",
    inputSchema: MarketOutputSchema,
    outputSchema: TradingDecisionSchema,
    execute: async ({ inputData }): Promise<TradingDecision> => {
        if (inputData.action === "hold" || inputData.confidence === "low") {
            return { tradeable: false };
        }
        return {
            tradeable: true,
            tradeDetails: {
                symbol: inputData.symbol,
                action: inputData.action as "buy" | "sell",
                price: inputData.price,
                stopLoss: inputData.stopLoss,
                takeProfit: inputData.takeProfit,
                positionSize: inputData.positionSize
            }
        };
    }
});

// Step 3: Execute Trade
const executeTrade = createStep({
    id: "execute-trade",
    description: "Executes the trade if it is tradeable",
    inputSchema: TradingDecisionSchema,
    outputSchema: TradingDecisionSchema,
    execute: async ({ inputData }): Promise<TradingDecision> => {
        if (!inputData.tradeable) return inputData; // Pass through if not tradeable

        // Mock successful trade execution
        const tradeResult = {
            success: true,
            orderId: "order-" + Date.now()
        };
        return { ...inputData, tradeResult };
    }
});

// Step 4: Monitor Position
const monitorPosition = createStep({
    id: "monitor-position",
    description: "Monitors the position if a trade was executed",
    inputSchema: TradingDecisionSchema,
    outputSchema: TradingDecisionSchema,
    execute: async ({ inputData }): Promise<TradingDecision> => {
        if (!inputData.tradeable || !inputData.tradeResult?.success) return inputData;

        const monitorInput = {
            symbol: inputData.tradeDetails!.symbol,
            orderId: inputData.tradeResult!.orderId!,
            entryPrice: inputData.tradeDetails!.price,
            stopLoss: inputData.tradeDetails!.stopLoss,
            takeProfit: inputData.tradeDetails!.takeProfit
        };
        
        // Mock position monitoring result
        const monitorResult: MonitorOutput = {
            status: "open",
            currentPrice: monitorInput.entryPrice * 1.01,
            unrealizedPnL: monitorInput.entryPrice * 0.01,
            action: "hold"
        };

        return { ...inputData, monitorResult };
    }
});

const FinalOutputSchema = z.object({
    status: z.enum(["success", "no_trade", "failed"]),
    reason: z.string().optional(),
    position: MonitorOutputSchema.optional()
});
type FinalOutput = z.infer<typeof FinalOutputSchema>;

// Final step to format the output
const formatOutput = createStep({
    id: "format-output",
    inputSchema: TradingDecisionSchema,
    outputSchema: FinalOutputSchema,
    execute: async ({ inputData }): Promise<FinalOutput> => {
        if (!inputData.tradeable) {
            return {
                status: "no_trade",
                reason: "No tradeable signal found"
            };
        }
        if (!inputData.tradeResult?.success) {
            return {
                status: "failed",
                reason: inputData.tradeResult?.error || "Trade execution failed"
            };
        }
        return {
            status: "success",
            position: inputData.monitorResult
        };
    }
});

const tradingWorkflow = createWorkflow({
    id: "trading-workflow",
    inputSchema: MarketInputSchema,
    outputSchema: FinalOutputSchema
})
.then(analyzeMarket)
.then(prepareTrade)
.then(executeTrade)
.then(monitorPosition)
.then(formatOutput);

tradingWorkflow.commit();

export { tradingWorkflow };
