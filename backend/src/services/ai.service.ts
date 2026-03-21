import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../config/aiPrompt";
import { parseAIResponse } from "../ai/ai.parser";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIChatParams {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  context: any;
}

export const callAIModel = async ({ messages, context }: AIChatParams) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "assistant",
          content: JSON.stringify(context),
        },
        ...messages,
      ],
    });

    const rawOutput = completion.choices[0].message.content || "{}";

    return parseAIResponse(rawOutput);
  } catch (error) {
    console.error("❌ AI Request Error:", error);

    return {
      answer: "Xin lỗi, hệ thống AI hiện không phản hồi.",
      intent: "error",
    };
  }
};
