<script lang="ts">
	import DOMPurify from "dompurify";
	import { marked } from "marked";
	import type { Snippet } from "svelte";

	let { props }: { props: { text?: string }; renderNode: Snippet<[unknown]> } = $props();

	// The model writes markdown here, so render it. Sanitize because it ends up in {@html}.
	const html = $derived(DOMPurify.sanitize(marked.parse(props.text ?? "", { async: false })));
</script>

<div class="markdown text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
	{@html html}
</div>

<style>
	.markdown :global(:is(p, ul, ol, pre, blockquote)) { margin: 0 0 0.5rem; }
	.markdown :global(:is(h1, h2, h3, h4)) { margin: 0.75rem 0 0.25rem; font-weight: 600; }
	.markdown :global(h1) { font-size: 1.25rem; }
	.markdown :global(h2) { font-size: 1.125rem; }
	.markdown :global(h3) { font-size: 1rem; }
	.markdown :global(ul) { list-style: disc; padding-left: 1.25rem; }
	.markdown :global(ol) { list-style: decimal; padding-left: 1.25rem; }
	.markdown :global(a) { text-decoration: underline; }
	.markdown :global(code) { font-family: ui-monospace, monospace; font-size: 0.85em; padding: 0.1rem 0.25rem; border-radius: 0.25rem; background: rgb(127 127 127 / 0.15); }
	.markdown :global(pre) { overflow-x: auto; padding: 0.75rem; border-radius: 0.5rem; background: rgb(127 127 127 / 0.12); }
	.markdown :global(pre code) { padding: 0; background: none; }
	.markdown :global(blockquote) { padding-left: 0.75rem; border-left: 3px solid rgb(127 127 127 / 0.35); }
	.markdown > :global(:last-child) { margin-bottom: 0; }
</style>
