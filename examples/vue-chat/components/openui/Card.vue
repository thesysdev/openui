<script setup lang="ts">
import { useRenderNode } from "@openuidev/vue-lang";

const { props } = defineProps<{ props: { title?: string; children?: unknown } }>();
const renderNode = useRenderNode();
</script>

<template>
  <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
    <h3 v-if="props.title" class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
      {{ props.title }}
    </h3>
    <div v-if="props.children" class="space-y-2">
      <component :is="() => renderNode(props.children)" />
    </div>
  </div>
</template>
