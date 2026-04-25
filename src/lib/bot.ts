import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import type { Lead } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const ACTIVE_AGENT = process.env.ACTIVE_AGENT ?? "silvina";

function loadAgentPrompt(): string {
  try {
    return readFileSync(join(process.cwd(), "agents", `${ACTIVE_AGENT}.md`), "utf-8");
  } catch {
    throw new Error(`No se encontró el archivo de agente: agents/${ACTIVE_AGENT}.md`);
  }
}

const SYSTEM_PROMPT = loadAgentPrompt();

const tools: Anthropic.Tool[] = [
  {
    name: "qualify_lead",
    description:
      "Registra el resultado de la conversación de calificación del lead. Llama a esta función cuando hayas recopilado suficiente información para tomar una decisión.",
    input_schema: {
      type: "object" as const,
      properties: {
        qualified: {
          type: "boolean",
          description: "true si el lead es genuino y merece seguimiento, false si es basura o no hay interés real",
        },
        reason: {
          type: "string",
          description: "Breve justificación de la decisión",
        },
        extracted_data: {
          type: "object",
          description: "Datos extraídos de la conversación",
          properties: {
            is_owner: { type: "boolean" },
            property_type: { type: "string" },
            property_city: { type: "string" },
            urgency: {
              type: "string",
              enum: ["inmediato", "3_meses", "6_meses", "sin_prisa"],
            },
            has_mortgage: { type: "boolean" },
            motivation: { type: "string" },
          },
        },
      },
      required: ["qualified", "reason"],
    },
  },
];

export interface BotResult {
  response: string;
  qualified?: boolean;
  extractedData?: Partial<Lead>;
  conversationEnded: boolean;
}

function sanitizeInput(raw: string): string {
  return raw
    .slice(0, 800)                    // cap length to ~200 tokens
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars (keep \n \r \t)
    .trim();
}

export async function processBotMessage(
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  incomingMessage: string
): Promise<BotResult> {
  const sanitized = sanitizeInput(incomingMessage);

  // Keep last 20 messages to prevent token exhaustion
  const recentHistory = conversationHistory.slice(-20);

  const messages: Anthropic.MessageParam[] = [
    ...recentHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user" as const, content: sanitized },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    tools,
    messages,
  });

  // Check if Claude wants to call the qualify_lead tool
  const toolUseBlock = response.content.find((b) => b.type === "tool_use");
  if (toolUseBlock && toolUseBlock.type === "tool_use") {
    const input = toolUseBlock.input as {
      qualified: boolean;
      reason: string;
      extracted_data?: {
        is_owner?: boolean;
        property_type?: string;
        property_city?: string;
        urgency?: Lead["urgency"];
        has_mortgage?: boolean;
        motivation?: string;
      };
    };

    // Get the text response Claude generated alongside the tool call
    const textBlock = response.content.find((b) => b.type === "text");
    const responseText = textBlock && textBlock.type === "text" ? textBlock.text : "";

    return {
      response: responseText,
      qualified: input.qualified,
      extractedData: input.extracted_data
        ? {
            is_owner: input.extracted_data.is_owner,
            property_type: input.extracted_data.property_type as Lead["property_type"],
            property_city: input.extracted_data.property_city,
            urgency: input.extracted_data.urgency,
            has_mortgage: input.extracted_data.has_mortgage,
            notes: input.extracted_data.motivation,
          }
        : undefined,
      conversationEnded: true,
    };
  }

  // Normal text response
  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

  return {
    response: text,
    conversationEnded: false,
  };
}
