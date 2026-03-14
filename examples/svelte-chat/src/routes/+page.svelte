<script lang="ts">
	import type { ActionEvent } from "@openuidev/svelte-lang";
	import ChatMessage from "$lib/components/ChatMessage.svelte";
	import ChatInput from "$lib/components/ChatInput.svelte";
	import { library } from "$lib/library";
	import "../app.css";

	interface Message {
		id: string;
		role: "user" | "assistant";
		content: string;
	}

	let messages = $state<Message[]>([]);
	let inputValue = $state("");
	let isStreaming = $state(false);
	let currentStreamingMessage = $state("");

	async function handleSendMessage(message: string) {
		// Add user message
		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: "user",
			content: message,
		};
		messages = [...messages, userMessage];
		inputValue = "";
		isStreaming = true;
		currentStreamingMessage = "";

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: messages.map((m) => ({
						role: m.role,
						content: m.content,
					})),
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to get response");
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error("No response body");
			}

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				currentStreamingMessage += chunk;
			}

			// Add assistant message
			const assistantMessage: Message = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: currentStreamingMessage,
			};
			messages = [...messages, assistantMessage];
			currentStreamingMessage = "";
		} catch (error) {
			console.error("Error sending message:", error);
			const errorMessage: Message = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: "Sorry, there was an error processing your request.",
			};
			messages = [...messages, errorMessage];
		} finally {
			isStreaming = false;
		}
	}

	function handleAction(event: ActionEvent) {
		console.log("Action triggered:", event);
		// Handle action events from interactive components
		if (event.humanFriendlyMessage) {
			handleSendMessage(event.humanFriendlyMessage);
		}
	}
</script>

<div class="mx-auto flex min-h-screen max-w-5xl flex-col p-6">
	<header class="mb-6 text-center">
		<h1 class="mb-1 text-3xl font-bold text-foreground">Svelte OpenUI Chat</h1>
		<p class="text-muted-foreground">Chat with an AI assistant using OpenUI Lang components</p>
	</header>

	<div class="flex min-h-0 flex-1 flex-col gap-4">
		<div class="flex-1 overflow-y-auto rounded-lg bg-muted/30 p-4">
			{#each messages as message (message.id)}
				<ChatMessage
					role={message.role}
					content={message.content}
					library={message.role === "assistant" ? library : undefined}
					isStreaming={false}
					onAction={handleAction}
				/>
			{/each}

			{#if isStreaming && currentStreamingMessage}
				<ChatMessage
					role="assistant"
					content={currentStreamingMessage}
					{library}
					isStreaming={true}
					onAction={handleAction}
				/>
			{/if}
		</div>

		<div class="shrink-0">
			<ChatInput
				value={inputValue}
				disabled={isStreaming}
				onSubmit={handleSendMessage}
				onInput={(value) => (inputValue = value)}
			/>
		</div>
	</div>
</div>
