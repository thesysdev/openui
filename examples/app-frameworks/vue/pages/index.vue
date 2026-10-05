<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { Chat } from "@ai-sdk/vue";
import { BuiltinActionType, type ActionEvent } from "@openuidev/vue-lang";
import { library } from "~/lib/library";
import ChatHeader from "~/components/ChatHeader.vue";
import WelcomeScreen from "~/components/WelcomeScreen.vue";
import UserMessage from "~/components/UserMessage.vue";
import AssistantMessage from "~/components/AssistantMessage.vue";
import LoadingIndicator from "~/components/LoadingIndicator.vue";
import ChatInput from "~/components/ChatInput.vue";

const messagesEnd = ref<HTMLDivElement>();

// Chat class internally uses Vue refs for messages/status/error
// We poll state via a shallow ref that re-triggers on changes
const chat = new Chat({ api: "/api/chat" });

// Reactive wrappers - Chat's VueChatState uses internal Vue refs
// We need to access them through computed properties
const messages = computed(() => chat.messages);
const status = computed(() => chat.status);
const isLoading = computed(() => status.value === "submitted" || status.value === "streaming");

function handleSend(text: string) {
  if (!text.trim() || isLoading.value) return;
  chat.sendMessage({ text: text.trim() });
}

function handleAction(event: ActionEvent) {
  if (event.type === BuiltinActionType.ContinueConversation && event.humanFriendlyMessage) {
    handleSend(event.humanFriendlyMessage);
  }
}

watch(
  messages,
  () => {
    nextTick(() => {
      messagesEnd.value?.scrollIntoView({ behavior: "smooth" });
    });
  },
  { deep: true },
);

const starters = [
  "What is Vue 3.5?",
  "What's the weather in Tokyo?",
  "Compare React and Vue",
  "Look up NVDA stock price",
];
</script>

<template>
  <div class="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
    <ChatHeader />

    <div class="flex-1 overflow-y-auto">
      <WelcomeScreen v-if="messages.length === 0" :starters="starters" @send="handleSend" />
      <div v-else class="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <template v-for="(message, i) in messages" :key="message.id">
          <UserMessage v-if="message.role === 'user'" :parts="message.parts" />
          <AssistantMessage
            v-else-if="message.role === 'assistant'"
            :parts="[...message.parts]"
            :library="library"
            :is-streaming="isLoading && i === messages.length - 1"
            :on-action="handleAction"
          />
        </template>

        <LoadingIndicator
          v-if="
            isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === 'user')
          "
        />

        <div ref="messagesEnd"></div>
      </div>
    </div>

    <ChatInput :is-loading="isLoading" @submit="handleSend" @stop="() => chat.stop()" />
  </div>
</template>
