<script setup lang="ts">
import { computed } from "vue";
import MarkdownIt from "markdown-it";
const input = defineProps<{ props: { text?: string } }>();
const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true });
const html = computed(() => markdown.render(input.props.text ?? ""));
</script>

<template>
  <div
    class="markdown-content text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
    v-html="html"
  />
</template>
