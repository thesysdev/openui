<script setup lang="ts">
import { useTriggerAction } from "@openuidev/vue-lang";

const { props } = defineProps<{ props: { label?: string; action?: string } }>();
const triggerAction = useTriggerAction();
</script>

<template>
  <button
    class="inline-flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
    @click="triggerAction(props.label ?? 'Click', undefined, props.action ? { type: props.action } : undefined)"
  >
    {{ props.label ?? "Button" }}
  </button>
</template>
