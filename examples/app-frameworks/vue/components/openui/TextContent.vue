<script setup lang="ts">
import DOMPurify from "dompurify";
import { marked } from "marked";
import { computed } from "vue";

const { props } = defineProps<{ props: { text?: string } }>();

// The model writes markdown here, so render it. Sanitize because it ends up in v-html.
const html = computed(() => DOMPurify.sanitize(marked.parse(props.text ?? "", { async: false })));
</script>

<template>
  <div
    class="markdown text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
    v-html="html"
  />
</template>

<style scoped>
.markdown :deep(:is(p, ul, ol, pre, blockquote)) { margin: 0 0 0.5rem; }
.markdown :deep(:is(h1, h2, h3, h4)) { margin: 0.75rem 0 0.25rem; font-weight: 600; }
.markdown :deep(h1) { font-size: 1.25rem; }
.markdown :deep(h2) { font-size: 1.125rem; }
.markdown :deep(h3) { font-size: 1rem; }
.markdown :deep(ul) { list-style: disc; padding-left: 1.25rem; }
.markdown :deep(ol) { list-style: decimal; padding-left: 1.25rem; }
.markdown :deep(a) { text-decoration: underline; }
.markdown :deep(code) { font-family: ui-monospace, monospace; font-size: 0.85em; padding: 0.1rem 0.25rem; border-radius: 0.25rem; background: rgb(127 127 127 / 0.15); }
.markdown :deep(pre) { overflow-x: auto; padding: 0.75rem; border-radius: 0.5rem; background: rgb(127 127 127 / 0.12); }
.markdown :deep(pre code) { padding: 0; background: none; }
.markdown :deep(blockquote) { padding-left: 0.75rem; border-left: 3px solid rgb(127 127 127 / 0.35); }
.markdown > :deep(:last-child) { margin-bottom: 0; }
</style>
