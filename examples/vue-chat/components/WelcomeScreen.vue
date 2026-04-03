<script setup lang="ts">
defineProps<{ starters: string[] }>();
const emit = defineEmits<{ send: [text: string] }>();
</script>

<template>
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
      <button
        v-for="starter in starters"
        :key="starter"
        class="text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        @click="emit('send', starter)"
      >
        {{ starter }}
      </button>
    </div>
  </div>
</template>
