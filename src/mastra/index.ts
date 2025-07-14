import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { tradingBot } from "./agents/trading-bot/trading-agent";
import { tradingWorkflow } from "./agents/trading-bot/trading-workflow";

export const mastra = new Mastra({
	workflows: { tradingWorkflow },
	agents: { tradingBot },
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	server: {
		port: 8080,
		timeout: 10000,
	},
});
