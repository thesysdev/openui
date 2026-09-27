<script lang="ts">
  import MarkdownIt from "markdown-it";
  import type { Snippet } from "svelte";
  let { props }: { props: { text?: string }; renderNode: Snippet<[unknown]> } = $props();
  const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true });
  const html = $derived(markdown.render(props.text ?? ""));
</script>

<div class="markdown-content text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{@html html}</div>
