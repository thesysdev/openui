<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  isLoading: boolean;
}>();

const emit = defineEmits<{
  submit: [text: string];
  stop: [];
}>();

const input = ref("");

function handleSubmit() {
  const text = input.value.trim();
  if (!text || props.isLoading) return;
  input.value = "";
  emit("submit", text);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
}
</script>

<template>
  <div class="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
    <form class="max-w-3xl mx-auto flex gap-2" @submit.prevent="handleSubmit">
      <input
        v-model="input"
        type="text"
        placeholder="Type a message..."
        :disabled="isLoading"
        class="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
        @keydown="handleKeydown"
      />
      <button
        v-if="isLoading"
        type="button"
        class="rounded-xl bg-zinc-200 dark:bg-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
        @click="$emit('stop')"
      >
        Stop
      </button>
      <button
        v-else
        type="submit"
        :disabled="!input.trim()"
        class="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Send
      </button>
    </form>
  </div>
</template>
