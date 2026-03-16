<script lang="ts">
	import { Renderer, type ActionEvent } from "@openuidev/svelte-lang";
	import { library } from "$lib/library";
	import "../app.css";

	// Mock responses in openui-lang format
	const MOCK_RESPONSES: Record<string, string> = {
		default: `root = Stack(
  Card("Welcome to OpenUI",
    TextContent("This is a demo of @openuidev/svelte-lang — a Svelte 5 renderer for structured LLM output."),
    TextContent("Try typing a message below to see the streaming parser in action."),
    Button("Get Started")
  )
)`,
		greeting: `root = Stack(
  Card("Hello!",
    TextContent("Nice to meet you! I can render structured UI from LLM streams."),
    Button("Tell me more")
  )
)`,
		more: `root = Stack(
  Card("How It Works",
    TextContent("1. Define components with Zod schemas"),
    TextContent("2. Create a library from those components"),
    TextContent("3. Pass LLM streaming text to the Renderer"),
    TextContent("4. The parser converts it to a live component tree")
  ),
  Card("Features",
    TextContent("Real-time streaming parser"),
    TextContent("Error boundaries for resilient rendering"),
    TextContent("Form state management"),
    TextContent("Action event system"),
    Button("Cool!")
  )
)`,
	};

	let messages: Array<{ role: "user" | "assistant"; content: string }> = $state([]);
	let input = $state("");
	let isStreaming = $state(false);
	let currentResponse = $state<string | null>(null);

	async function simulateStream(text: string) {
		isStreaming = true;
		currentResponse = "";
		for (let i = 0; i < text.length; i++) {
			currentResponse += text[i];
			await new Promise((r) => setTimeout(r, 5));
		}
		isStreaming = false;
	}

	async function sendMessage() {
		const text = input.trim();
		if (!text || isStreaming) return;
		input = "";
		messages = [...messages, { role: "user", content: text }];

		// Pick a response based on keywords
		let responseKey = "default";
		const lower = text.toLowerCase();
		if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
			responseKey = "greeting";
		}
		if (lower.includes("more") || lower.includes("how") || lower.includes("feature")) {
			responseKey = "more";
		}

		const responseText = MOCK_RESPONSES[responseKey] ?? MOCK_RESPONSES.default;
		await simulateStream(responseText);
		messages = [...messages, { role: "assistant", content: responseText }];
		currentResponse = null;
	}

	function handleAction(event: ActionEvent) {
		const msg = event.humanFriendlyMessage;
		input = msg;
		sendMessage();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	// Show initial response on load
	$effect(() => {
		simulateStream(MOCK_RESPONSES.default);
	});
</script>

<div class="chat-container">
	<header class="chat-header">
		<h1>OpenUI Svelte Chat</h1>
		<p>Powered by @openuidev/svelte-lang</p>
	</header>

	<div class="chat-messages">
		{#each messages as msg}
			{#if msg.role === "user"}
				<div class="message user-message">
					<p>{msg.content}</p>
				</div>
			{:else}
				<div class="message assistant-message">
					<Renderer response={msg.content} {library} onAction={handleAction} />
				</div>
			{/if}
		{/each}

		{#if currentResponse !== null}
			<div class="message assistant-message">
				<Renderer response={currentResponse} {library} {isStreaming} onAction={handleAction} />
			</div>
		{/if}
	</div>

	<div class="chat-input-area">
		<input
			type="text"
			placeholder="Type a message..."
			bind:value={input}
			onkeydown={handleKeydown}
			disabled={isStreaming}
		/>
		<button onclick={sendMessage} disabled={isStreaming || !input.trim()}>Send</button>
	</div>
</div>

<style>
	.chat-container {
		max-width: 640px;
		margin: 0 auto;
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.chat-header {
		padding: 16px;
		text-align: center;
		border-bottom: 1px solid #e5e5e5;
		background: white;
	}

	.chat-header h1 {
		font-size: 1.2rem;
	}

	.chat-header p {
		font-size: 0.8rem;
		color: #666;
	}

	.chat-messages {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.message {
		max-width: 85%;
	}

	.user-message {
		align-self: flex-end;
		background: #2563eb;
		color: white;
		padding: 8px 12px;
		border-radius: 12px 12px 0 12px;
	}

	.user-message p {
		margin: 0;
	}

	.assistant-message {
		align-self: flex-start;
	}

	.chat-input-area {
		padding: 12px;
		border-top: 1px solid #e5e5e5;
		background: white;
		display: flex;
		gap: 8px;
	}

	.chat-input-area input {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.9rem;
	}

	.chat-input-area button {
		padding: 8px 16px;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	.chat-input-area button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
