import { z } from "zod";
export interface BriefProvider {
  generate(description: string): Promise<string>;
}
export class ProviderUnavailable extends Error {}
class CompatibleChatProvider implements BriefProvider {
  async generate(description: string) {
    if (!process.env.AI_API_KEY)
      throw new ProviderUnavailable(
        "AI is not configured. Write your brief manually; all publishing tools remain available.",
      );
    const response = await fetch(
      `${process.env.AI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "gpt-4.1-mini",
          store: false,
          messages: [
            {
              role: "system",
              content:
                "Help write a problem brief. Return concise plain text with title, brief, skills, deliverables, evaluation criteria, milestones and clarifying questions. Never invent prizes or promises. This is a draft requiring human approval.",
            },
            { role: "user", content: description },
          ],
        }),
        signal: AbortSignal.timeout(25000),
      },
    );
    if (!response.ok)
      throw new ProviderUnavailable(
        "The AI provider could not generate a draft.",
      );
    const data = z
      .object({
        choices: z
          .array(
            z.object({ message: z.object({ content: z.string().min(1) }) }),
          )
          .min(1),
      })
      .parse(await response.json());
    return data.choices[0].message.content;
  }
}
export const briefProvider: BriefProvider = new CompatibleChatProvider();
