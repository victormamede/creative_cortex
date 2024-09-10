import "dotenv/config";

import Fastify from "fastify";
import generateNextPart, { storyParts } from "./generator";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { z } from "zod";
import { shuffle } from "./utils/array";

async function main() {
  const fastify = Fastify({
    logger: true,
  });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Creative Cortex",
        description: "API to the creative cortex project",
        version: "0.1.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
      tags: [],
      components: {
        securitySchemes: {
          apiKey: {
            type: "apiKey",
            name: "apiKey",
            in: "header",
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  await fastify.register(swaggerUi, {
    routePrefix: "/documentation",
  });

  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // Routes
  app.get("/", (req, reply) => {
    return { message: "Hello" };
  });

  app.post(
    "/messages",
    {
      schema: {
        description: "Choose a message to complete the story",
        summary: "Create new completion",
        body: z.object({
          messages: z
            .object({
              externalId: z.string(),
              message: z.string(),
            })
            .array(),
        }),
        response: {
          200: z.object({
            chosenMessageExternalId: z.string(),
            message: z.object({
              text: z.string(),
              imageUrl: z.string().optional(),
            }),
          }),
        },
      },
    },
    async (req, res) => {
      const { messages } = req.body;
      // TODO: Optimize this
      const messagesToTest = shuffle(messages).slice(0, 10);

      const { chosenIndex, final, image } = await generateNextPart(
        messagesToTest.map((message) => message.message)
      );

      const chosenMessage = messagesToTest[chosenIndex];

      return {
        chosenMessageExternalId: chosenMessage.externalId,
        message: { imageUrl: image, text: final },
      };
    }
  );

  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
main();
