<script setup lang="ts">
import { computed } from "vue";
import { Renderer, type ActionEvent, type Library } from "@openuidev/vue-lang";

const props = defineProps<{
  parts: any[];
  library: Library;
  isStreaming: boolean;
  onAction: (event: ActionEvent) => void;
}>();

const textContent = computed(() =>
  props.parts
    .filter((p: any) => p.type === "text")
    .map((p: any) => p.text)
    .join(""),
);

const toolParts = computed(() =>
  props.parts.filter((p: any) => p.type?.startsWith("tool-") || p.type === "dynamic-tool"),
);

function getToolName(part: any): string {
  if (part.type === "dynamic-tool" && "toolName" in part) return part.toolName;
  return part.type?.replace(/^tool-/, "") ?? "";
}
</script>

<template>
  <div class="flex gap-3">
    <div
      class="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"
    >
      <span class="text-[10px] font-bold text-white">AI</span>
    </div>
    <div class="flex-1 min-w-0 space-y-2">
      <div
        v-for="(tp, i) in toolParts"
        :key="i"
        class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
      >
        <template v-if="(tp as any).state === 'output-available'">
          <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </template>
        <template v-else>
          <div class="w-3.5 h-3.5 border-2 border-zinc-300 dark:border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
        </template>
        <span class="font-medium">{{ getToolName(tp) }}</span>
      </div>
      <Renderer
        v-if="textContent"
        :response="textContent"
        :library="library"
        :is-streaming="isStreaming"
        :on-action="onAction"
      />
    </div>
  </div>
</template>
