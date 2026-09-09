import { cloudInstructions } from "@/lib/cloud-prompt";
import { OpenUICloudGateway, openuiCloudModelId } from "@/openui-cloud-gateway";
import { getStockPrice, getWeather } from "@/tools";
import { Agent } from "@mastra/core/agent";
import { Mastra } from "@mastra/core";

export const openuiAgent = new Agent({
  id: "openui-mastra-agent",
  name: "OpenUI x Mastra Agent",
  instructions: cloudInstructions(
    "You are a helpful assistant. Use tools when relevant and help the user with their requests. Always format your responses cleanly.",
  ),
  model: { id: openuiCloudModelId },
  tools: { getWeather, getStockPrice },
});

export const mastra = new Mastra({
  gateways: {
    openuiCloud: new OpenUICloudGateway(),
  },
  agents: {
    openui: openuiAgent,
  },
});
