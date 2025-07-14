import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { weatherAgent } from "./agents/weather-agent/weather-agent"; 
import { weatherWorkflow } from "./agents/weather-agent/weather-workflow";
import { tradingBot } from "./agents/trading-bot/trading-agent";
import { tradingWorkflow } from "./agents/trading-bot/trading-workflow";

export const mastra = new Mastra({
	workflows: { weatherWorkflow, tradingWorkflow },
	agents: { weatherAgent, tradingBot },
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	server: {
		port: 8080,
		timeout: 10000,
	},
});
