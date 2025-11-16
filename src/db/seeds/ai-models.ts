/**
 * AI Models Seed Data
 *
 * Popular AI models available through OpenRouter
 * Pricing is approximate and should be updated regularly from:
 * https://openrouter.ai/models
 *
 * Last updated: November 2025
 */

import { db } from "@/db";
import { aiModels } from "@/db/schema";

export const popularAIModels = [
  // OpenAI Models
  {
    modelId: "openai/gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    description: "Most capable GPT-4 model, optimized for chat and complex tasks. 128K context window.",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputCostPer1kTokens: "0.01",
    outputCostPer1kTokens: "0.03",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: true,
      jsonMode: true,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 2048,
      tags: ["chat", "reasoning", "vision", "function-calling"],
    },
  },
  {
    modelId: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "High-intelligence flagship model for complex, multi-step tasks. Most capable model.",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputCostPer1kTokens: "0.0025",
    outputCostPer1kTokens: "0.01",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: true,
      jsonMode: true,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 4096,
      tags: ["chat", "reasoning", "vision", "multimodal", "recommended"],
    },
  },
  {
    modelId: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    description: "Fast, cost-effective model for simple tasks. 16K context window.",
    contextWindow: 16384,
    maxOutputTokens: 4096,
    inputCostPer1kTokens: "0.0005",
    outputCostPer1kTokens: "0.0015",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      jsonMode: true,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 2048,
      tags: ["chat", "fast", "affordable"],
    },
  },

  // Anthropic Models
  {
    modelId: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Best combination of performance and speed. Excellent for coding and analysis.",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPer1kTokens: "0.003",
    outputCostPer1kTokens: "0.015",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: true,
      jsonMode: false,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 4096,
      tags: ["chat", "coding", "analysis", "vision", "recommended"],
    },
  },
  {
    modelId: "anthropic/claude-3-opus",
    name: "Claude 3 Opus",
    provider: "anthropic",
    description: "Most powerful Claude model for complex tasks requiring deep reasoning.",
    contextWindow: 200000,
    maxOutputTokens: 4096,
    inputCostPer1kTokens: "0.015",
    outputCostPer1kTokens: "0.075",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: true,
      jsonMode: false,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 4096,
      tags: ["chat", "reasoning", "vision", "complex-tasks"],
    },
  },
  {
    modelId: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    description: "Fastest and most cost-effective Claude model. Great for simple tasks.",
    contextWindow: 200000,
    maxOutputTokens: 4096,
    inputCostPer1kTokens: "0.00025",
    outputCostPer1kTokens: "0.00125",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: true,
      jsonMode: false,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 2048,
      tags: ["chat", "fast", "affordable"],
    },
  },

  // Google Models
  {
    modelId: "google/gemini-pro-1.5",
    name: "Gemini 1.5 Pro",
    provider: "google",
    description: "Mid-size multimodal model for a broad range of tasks. 2M token context.",
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    inputCostPer1kTokens: "0.00125",
    outputCostPer1kTokens: "0.005",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: true,
      jsonMode: false,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 4096,
      tags: ["chat", "multimodal", "long-context", "vision"],
    },
  },
  {
    modelId: "google/gemini-flash-1.5",
    name: "Gemini 1.5 Flash",
    provider: "google",
    description: "Fast and versatile multimodal model. Great price-performance ratio.",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    inputCostPer1kTokens: "0.000075",
    outputCostPer1kTokens: "0.0003",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: true,
      jsonMode: false,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 4096,
      tags: ["chat", "fast", "affordable", "multimodal", "recommended"],
    },
  },

  // Meta Models
  {
    modelId: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B Instruct",
    provider: "meta-llama",
    description: "Latest Llama model with improved reasoning and instruction following.",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputCostPer1kTokens: "0.00035",
    outputCostPer1kTokens: "0.0004",
    capabilities: {
      streaming: true,
      functionCalling: false,
      vision: false,
      jsonMode: false,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 2048,
      tags: ["chat", "open-source", "affordable"],
    },
  },

  // Mistral Models
  {
    modelId: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "mistralai",
    description: "Flagship Mistral model with top-tier reasoning capabilities.",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputCostPer1kTokens: "0.002",
    outputCostPer1kTokens: "0.006",
    capabilities: {
      streaming: true,
      functionCalling: true,
      vision: false,
      jsonMode: false,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 2048,
      tags: ["chat", "reasoning", "function-calling"],
    },
  },
  {
    modelId: "mistralai/mistral-small",
    name: "Mistral Small",
    provider: "mistralai",
    description: "Cost-effective model for simple tasks and high-volume use cases.",
    contextWindow: 32000,
    maxOutputTokens: 4096,
    inputCostPer1kTokens: "0.0002",
    outputCostPer1kTokens: "0.0006",
    capabilities: {
      streaming: true,
      functionCalling: false,
      vision: false,
      jsonMode: false,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 2048,
      tags: ["chat", "fast", "affordable"],
    },
  },

  // Specialized Models
  {
    modelId: "perplexity/llama-3.1-sonar-huge-128k-online",
    name: "Perplexity Sonar Huge Online",
    provider: "perplexity",
    description: "Llama-based model with real-time web search capabilities.",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputCostPer1kTokens: "0.005",
    outputCostPer1kTokens: "0.005",
    capabilities: {
      streaming: true,
      functionCalling: false,
      vision: false,
      jsonMode: false,
    },
    config: {
      defaultTemperature: 0.7,
      defaultMaxTokens: 2048,
      tags: ["chat", "web-search", "real-time"],
    },
  },
];

/**
 * Seed the AI models table
 */
export async function seedAIModels() {
  console.log("Seeding AI models...");

  for (const model of popularAIModels) {
    await db
      .insert(aiModels)
      .values(model)
      .onConflictDoUpdate({
        target: [aiModels.modelId],
        set: {
          name: model.name,
          description: model.description,
          contextWindow: model.contextWindow,
          maxOutputTokens: model.maxOutputTokens,
          inputCostPer1kTokens: model.inputCostPer1kTokens,
          outputCostPer1kTokens: model.outputCostPer1kTokens,
          capabilities: model.capabilities,
          config: model.config,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`✅ Seeded ${popularAIModels.length} AI models`);
}

// Run if called directly
if (require.main === module) {
  seedAIModels()
    .then(() => {
      console.log("Seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error seeding AI models:", error);
      process.exit(1);
    });
}
