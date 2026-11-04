<script setup lang="ts">
defineProps<{
  /** Shown once there is a conversation to clear. */
  canStartNew?: boolean;
  disabled?: boolean;
}>();

defineEmits<{ newChat: [] }>();
</script>

<template>
  <header
    class="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 flex items-center justify-between gap-4"
  >
    <div>
      <h1 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">OpenUI Vue Chat</h1>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">
        Powered by @openuidev/vue-lang &amp; Vercel AI SDK
      </p>
    </div>
    <button
      v-if="canStartNew"
      type="button"
      :disabled="disabled"
      class="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      @click="$emit('newChat')"
    >
      New chat
    </button>
  </header>
</template>
