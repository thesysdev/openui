<script lang="ts">
	import { Chat } from "@ai-sdk/svelte";
	import { Renderer, BuiltinActionType, type ActionEvent } from "@openuidev/svelte-lang";
	import { library } from "$lib/library";

	let input = $state("");
	let messagesEnd = $state<HTMLDivElement>();
	const chat = new Chat({});

	const isLoading = $derived(chat.status === "submitted" || chat.status === "streaming");

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const text = input.trim();
		if (!text || isLoading) return;
		input = "";
		chat.sendMessage({ text });
	}

	function handleSend(text: string) {
		if (!text.trim() || isLoading) return;
		chat.sendMessage({ text: text.trim() });
	}

	function handleAction(event: ActionEvent) {
		if (event.type === BuiltinActionType.ContinueConversation && event.humanFriendlyMessage) {
			handleSend(event.humanFriendlyMessage);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(new SubmitEvent("submit"));
		}
	}

	function getTextContent(parts: any[]): string {
		return parts
			.filter((p: any) => p.type === "text")
			.map((p: any) => p.text)
			.join("");
	}

	function isToolPart(part: any): boolean {
		return part.type?.startsWith("tool-") || part.type === "dynamic-tool";
	}

	function getToolName(part: any): string {
		if (part.type === "dynamic-tool" && "toolName" in part) return part.toolName;
		return part.type?.replace(/^tool-/, "") ?? "";
	}

	$effect(() => {
		messagesEnd?.scrollIntoView({ behavior: "smooth" });
	});

	const starters = [
		"What is Svelte 5?",
		"What's the weather in Tokyo?",
		"Compare React and Svelte",
		"Look up NVDA stock price",
	];
</script>

<div class="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
	<header
		class="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4"
	>
		<h1 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">OpenUI Svelte Chat</h1>
		<p class="text-xs text-zinc-500 dark:text-zinc-400">
			Powered by @openuidev/svelte-lang & Vercel AI SDK
		</p>
	</header>

	<div class="flex-1 overflow-y-auto">
		{#if chat.messages.length === 0}
			<div class="flex flex-col items-center justify-center h-full px-4">
				<div class="text-center mb-8">
					<h2 class="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
						Welcome to OpenUI Chat
					</h2>
					<p class="text-zinc-500 dark:text-zinc-400">
						Ask anything — responses are rendered as structured UI components.
					</p>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
					{#each starters as starter}
						<button
							class="text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
							onclick={() => handleSend(starter)}
						>
							{starter}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<div class="max-w-3xl mx-auto px-4 py-6 space-y-6">
				{#each chat.messages as message, i}
					{#if message.role === "user"}
						<div class="flex justify-end">
							<div
								class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%]"
							>
								{#each message.parts as part}
									{#if part.type === "text"}
										<p class="text-sm">{part.text}</p>
									{/if}
								{/each}
							</div>
						</div>
					{:else if message.role === "assistant"}
						{@const textContent = getTextContent(message.parts)}
						{@const toolParts = message.parts.filter(isToolPart)}
						{@const isLast = i === chat.messages.length - 1}
						<div class="flex gap-3">
							<div
								class="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"
							>
								<span class="text-[10px] font-bold text-white">AI</span>
							</div>
							<div class="flex-1 min-w-0 space-y-2">
								{#each toolParts as tp}
									{@const state = (tp as any).state}
									{@const done = state === "output-available"}
									<div class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
										{#if done}
											<svg
												class="w-3.5 h-3.5 text-green-500"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2.5"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										{:else}
											<div
												class="w-3.5 h-3.5 border-2 border-zinc-300 dark:border-zinc-600 border-t-transparent rounded-full animate-spin"
											></div>
										{/if}
										<span class="font-medium">{getToolName(tp)}</span>
									</div>
								{/each}
								{#if textContent}
									<Renderer
										response={textContent}
										{library}
										isStreaming={isLoading && isLast}
										onAction={handleAction}
									/>
								{/if}
							</div>
						</div>
					{/if}
				{/each}

				{#if isLoading && (chat.messages.length === 0 || chat.messages[chat.messages.length - 1]?.role === "user")}
					<div class="flex gap-3">
						<div
							class="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"
						>
							<span class="text-[10px] font-bold text-white">AI</span>
						</div>
						<div class="flex items-center gap-1.5 py-2">
							<div
								class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
							></div>
							<div
								class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.15s]"
							></div>
							<div
								class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.3s]"
							></div>
						</div>
					</div>
				{/if}

				<div bind:this={messagesEnd}></div>
			</div>
		{/if}
	</div>

	<div
		class="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
	>
		<form class="max-w-3xl mx-auto flex gap-2" onsubmit={handleSubmit}>
			<input
				type="text"
				placeholder="Type a message..."
				bind:value={input}
				onkeydown={handleKeydown}
				disabled={isLoading}
				class="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
			/>
			{#if isLoading}
				<button
					type="button"
					onclick={() => chat.stop()}
					class="rounded-xl bg-zinc-200 dark:bg-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
				>
					Stop
				</button>
			{:else}
				<button
					type="submit"
					disabled={!input.trim()}
					class="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
				>
					Send
				</button>
			{/if}
		</form>
	</div>
</div>
