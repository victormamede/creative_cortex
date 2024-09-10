import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import openAi from "./utils/openai";

const storyPart = z.object({
  chosenIndex: z.number(),
  promptImproved: z.string(),
});

export const storyParts: { image?: string; source: string; final: String }[] =
  [];

export default async function generateNextPart(options: string[]) {
  const completion = await openAi.beta.chat.completions.parse({
    messages: [
      {
        role: "system",
        content:
          'Você completa histórias, vou te dar uma \
        história e no final alguns prompts entre """, você vai selecionar o \
        prompt que mais se encaixa com a história e fazer. \
        Algumas pequenas correções para manter consistência. \
        Tente fazer uma história engraçada. \
        Não repita o que foi dito anteriormente na história. \
        Max 20 palavras excluindo o prompt',
      },
      ...(storyParts.map(({ final }) => ({ role: "user", content: final })) as {
        role: "user";
        content: string;
      }[]),
      {
        role: "user",
        content: options.map((part) => `"""${part}"""`).join(", "),
      },
    ],
    max_tokens: 256,
    response_format: zodResponseFormat(storyPart, "story_part"),
    model: "gpt-4o-mini",
  });

  const nextPart = completion.choices[0].message.parsed;
  if (nextPart == null) throw new Error("Did not receive next part");

  const image = await openAi.images.generate({
    model: "dall-e-3",
    prompt: nextPart.promptImproved,

    n: 1,
    size: "1024x1024",
  });

  const newPart = {
    chosenIndex: nextPart.chosenIndex,
    source: options[nextPart.chosenIndex],
    final: nextPart.promptImproved,
    image: image.data[0].url,
  };

  storyParts.push(newPart);

  while (storyParts.length > 10) {
    storyParts.unshift();
  }

  return newPart;
}
