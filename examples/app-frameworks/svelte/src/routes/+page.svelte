<script lang="ts">
  import { Chat } from "@ai-sdk/svelte";
  import type { UIMessage } from "ai";
  import { BuiltinActionType, type ActionEvent } from "@openuidev/svelte-lang";
  import { library } from "$lib/library";
  import ChatHeader from "./ChatHeader.svelte";
  import WelcomeScreen from "./WelcomeScreen.svelte";
  import UserMessage from "./UserMessage.svelte";
  import AssistantMessage from "./AssistantMessage.svelte";
  import LoadingIndicator from "./LoadingIndicator.svelte";
  import ChatInput from "./ChatInput.svelte";

  let messagesEnd = $state<HTMLDivElement>();
  const MESSAGES_KEY = "openui-svelte:messages";
  function loadMessages(): UIMessage[] {
    try {
      return JSON.parse(localStorage.getItem(MESSAGES_KEY) ?? "[]");
    } catch {
      return [];
    }
  }
  const chat = new Chat({ messages: loadMessages() });

  const isLoading = $derived(chat.status === "submitted" || chat.status === "streaming");

  function handleSend(text: string) {
    if (!text.trim() || isLoading) return;
    chat.sendMessage({ text: text.trim() });
  }

  function handleAction(event: ActionEvent) {
    if (event.type === BuiltinActionType.ContinueConversation && event.humanFriendlyMessage) {
      handleSend(event.humanFriendlyMessage);
    }
  }

  $effect(() => {
    if (chat.status !== "ready" || chat.messages.length === 0) return;
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(chat.messages));
    } catch {}
  });

  $effect(() => {
    // Read the messages (including the one still streaming) so this re-runs as they change.
    void chat.messages.length;
    void JSON.stringify(chat.messages.at(-1));
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
  <ChatHeader />

  <div class="flex-1 overflow-y-auto">
    {#if chat.messages.length === 0}
      <WelcomeScreen {starters} onSend={handleSend} />
    {:else}
      <div class="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {#each chat.messages as message (message.id)}
          {#if message.role === "user"}
            <UserMessage parts={message.parts} />
          {:else if message.role === "assistant"}
            <AssistantMessage
              parts={message.parts}
              {library}
              isStreaming={isLoading && message.id === chat.messages[chat.messages.length - 1]?.id}
              onAction={handleAction}
            />
          {/if}
        {/each}

        {#if isLoading && (chat.messages.length === 0 || chat.messages[chat.messages.length - 1]?.role === "user")}
          <LoadingIndicator />
        {/if}

        <div bind:this={messagesEnd}></div>
      </div>
    {/if}
  </div>

  {#if chat.error && !isLoading}
    <div role="alert" class="mx-auto mb-2 w-[calc(100%-2rem)] max-w-3xl rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      {chat.error.message}
    </div>
  {/if}

  <ChatInput {isLoading} onSubmit={handleSend} onStop={() => chat.stop()} />
</div>
