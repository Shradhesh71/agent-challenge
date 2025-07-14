import { createTool } from "@mastra/core/tools";
import { z } from "zod";

interface MarketData {
    symbol: string;
    price: number;
    timestamp: number;
    ema50: number;
    ema200: number;
    rsi: number;
    macd: {
        macdLine: number;
        signalLine: number;
        histogram: number;
    };
}

interface Position {
    symbol: string;
    type: 'long' | 'short';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    size: number;
}

export const tradingTool = createTool({
    id: "market-analysis",
    description: "Analyze market data and execute trades based on trend following strategy",
    inputSchema: z.object({
        symbol: z.string().describe("Trading pair symbol (e.g., BTC/USD)"),
        action: z.enum(["analyze", "buy", "sell"]),
        amount: z.number().optional(),
        stopLoss: z.number().optional(),
        takeProfit: z.number().optional()
    }),
    outputSchema: z.object({
        symbol: z.string(),
        trend: z.enum(["uptrend", "downtrend", "sideways"]),
        price: z.number(),
        indicators: z.object({
            ema50: z.number(),
            ema200: z.number(),
            rsi: z.number(),
            macd: z.object({
                macdLine: z.number(),
                signalLine: z.number(),
                histogram: z.number()
            })
        }),
        position: z.object({
            type: z.enum(["none", "long", "short"]),
            entryPrice: z.number().optional(),
            stopLoss: z.number().optional(),
            takeProfit: z.number().optional(),
            size: z.number().optional()
        })
    }),
    execute: async ({ context }) => {
        return await analyzeMarket(context.symbol, context.action, context.amount, context.stopLoss, context.takeProfit);
    },
});

const calculateEMA = (prices: number[], period: number): number => {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
        ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
};

const calculateRSI = (prices: number[], period: number = 14): number => {
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < prices.length; i++) {
        const difference = prices[i] - prices[i - 1];
        if (difference >= 0) {
            gains += difference;
        } else {
            losses -= difference;
        }
    }
    
    const averageGain = gains / period;
    const averageLoss = losses / period;
    const relativeStrength = averageGain / averageLoss;
    return 100 - (100 / (1 + relativeStrength));
};

const calculateMACD = (prices: number[]): { macdLine: number; signalLine: number; histogram: number } => {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    const signalLine = calculateEMA([macdLine], 9);
    const histogram = macdLine - signalLine;
    
    return { macdLine, signalLine, histogram };
};


const getMarketData = async (symbol: string): Promise<MarketData> => {
    const mockPrice = Math.random() * 1000;
    const prices = Array(26).fill(0).map((_, i) => mockPrice + Math.random() * 10 - 5);
    
    return {
        symbol,
        price: mockPrice,
        timestamp: Date.now(),
        ema50: calculateEMA(prices, 50),
        ema200: calculateEMA(prices, 200),
        rsi: calculateRSI(prices),
        macd: calculateMACD(prices)
    };
};

const analyzeMarket = async (
    symbol: string,
    action: "analyze" | "buy" | "sell",
    amount?: number,
    stopLoss?: number,
    takeProfit?: number
) => {
    const marketData = await getMarketData(symbol);
    
    // Determine trend based on indicators
    const trend = determineTrend(marketData);
    
    // Handle trade execution if requested
    let position: Position | { type: "none" } = { type: "none" };
    if (action !== "analyze") {
        position = executeTrade(action, marketData, amount, stopLoss, takeProfit);
    }
    
    return {
        symbol: marketData.symbol,
        trend,
        price: marketData.price,
        indicators: {
            ema50: marketData.ema50,
            ema200: marketData.ema200,
            rsi: marketData.rsi,
            macd: marketData.macd
        },
        position
    };
};

const determineTrend = (data: MarketData): "uptrend" | "downtrend" | "sideways" => {
    const priceAboveEMA50 = data.price > data.ema50;
    const priceAboveEMA200 = data.price > data.ema200;
    const strongRSI = data.rsi > 50;
    const positiveMACD = data.macd.histogram > 0;
    
    if (priceAboveEMA50 && priceAboveEMA200 && strongRSI && positiveMACD) {
        return "uptrend";
    } else if (!priceAboveEMA50 && !priceAboveEMA200 && !strongRSI && !positiveMACD) {
        return "downtrend";
    }
    return "sideways";
};

const executeTrade = (
    action: "buy" | "sell",
    data: MarketData,
    amount?: number,
    stopLoss?: number,
    takeProfit?: number
): Position | { type: "none" } => {
    if (!amount) return { type: "none" };
    
    // In a real implementation, this would connect to an exchange API to execute trades
    return {
        symbol: data.symbol,
        type: action === "buy" ? "long" : "short",
        entryPrice: data.price,
        stopLoss: stopLoss || data.price * (action === "buy" ? 0.95 : 1.05),
        takeProfit: takeProfit || data.price * (action === "buy" ? 1.1 : 0.9),
        size: amount
    };
};
