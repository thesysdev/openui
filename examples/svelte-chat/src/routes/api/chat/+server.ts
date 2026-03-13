import { env } from "$env/dynamic/private";
import { library, promptOptions } from "$lib/library";
import OpenAI from "openai";
import type { RequestHandler } from "./$types";

function getOpenAIClient() {
	return new OpenAI({
		apiKey: env.OPENAI_API_KEY,
	});
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messages } = await request.json();

		// Generate system prompt from library (auto-generates syntax rules,
		// component signatures, and streaming guidance from the Zod schemas)
		const systemPrompt = library.prompt({
			preamble:
				"You are a helpful assistant that generates UI components using OpenUI Lang.",
			...promptOptions,
		});

		// Create streaming response
		const stream = await getOpenAIClient().chat.completions.create({
			model: "gpt-4",
			messages: [
				{ role: "system", content: systemPrompt },
				...messages,
			],
			stream: true,
		});

		// Create a readable stream
		const encoder = new TextEncoder();
		const readableStream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content || "";
						if (content) {
							controller.enqueue(encoder.encode(content));
						}
					}
					controller.close();
				} catch (error) {
					controller.error(error);
				}
			},
		});

		return new Response(readableStream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Error in chat API:", error);
		return new Response(
			JSON.stringify({ error: "Failed to process request" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
