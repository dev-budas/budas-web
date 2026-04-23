import Anthropic from "@anthropic-ai/sdk";
import type { Lead } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Eres Mediterra, asistente virtual de Budas del Mediterráneo, una inmobiliaria especializada en la costa mediterránea española.

Tu objetivo es entender si el contacto tiene un genuino interés en vender su propiedad. Debes conseguir, de forma natural y conversacional, la siguiente información:

1. Si es el propietario del inmueble
2. Tipo de propiedad y ubicación exacta (ciudad/barrio)
3. Motivación para vender (urgencia económica, cambio de vida, inversión)
4. Plazo en el que piensa vender (inmediato, 3 meses, 6 meses, sin prisa)
5. Si hay hipoteca pendiente

INSTRUCCIONES DE CONVERSACIÓN:
- Habla en español, con tono cálido y cercano. Como un profesional de confianza, no como un bot.
- No hagas todas las preguntas a la vez. Ve de forma natural, una o dos por mensaje.
- Si la persona da información extra, úsala para personalizar la conversación.
- Si detectas que NO hay intención real de venta, cierra la conversación educadamente.
- Máximo 8-10 turnos de conversación antes de concluir.
- Usa emojis con moderación y solo cuando sean naturales.

CUANDO HAYAS RECOPILADO SUFICIENTE INFORMACIÓN:
- Usa la herramienta qualify_lead para registrar el resultado.
- Si el lead es válido, dile que un agente especializado se pondrá en contacto para la valoración presencial.
- Si no es válido, cierra con amabilidad.`;

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

export async function processBotMessage(
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  incomingMessage: string
): Promise<BotResult> {
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user" as const, content: incomingMessage },
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
