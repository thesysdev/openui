<script lang="ts">
  import { Chat } from "@ai-sdk/svelte";
  import { BuiltinActionType, type ActionEvent } from "@openuidev/svelte-lang";
  import { library } from "$lib/library";
  import ChatHeader from "./ChatHeader.svelte";
  import WelcomeScreen from "./WelcomeScreen.svelte";
  import UserMessage from "./UserMessage.svelte";
  import AssistantMessage from "./AssistantMessage.svelte";
  import LoadingIndicator from "./LoadingIndicator.svelte";
  import ChatInput from "./ChatInput.svelte";

  let messagesEnd = $state<HTMLDivElement>();
  const chat = new Chat({});

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
        {#each chat.messages as message, i}
          {#if message.role === "user"}
            <UserMessage parts={message.parts} />
          {:else if message.role === "assistant"}
            <AssistantMessage
              parts={message.parts}
              {library}
              isStreaming={isLoading && i === chat.messages.length - 1}
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

  <ChatInput {isLoading} onSubmit={handleSend} onStop={() => chat.stop()} />
</div>
