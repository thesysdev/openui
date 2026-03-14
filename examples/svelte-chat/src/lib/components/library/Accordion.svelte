<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";
	import * as Accordion from "$lib/components/ui/accordion/index.js";

	// Parser returns items as ElementNode objects: { type: "element", props: { value, trigger, content } }
	interface AccordionItemNode {
		props: {
			value: string;
			trigger: string;
			content: unknown[];
		};
	}

	interface Props
		extends ComponentRenderProps<{
			items: AccordionItemNode[];
		}> {}

	let { props, renderNode }: Props = $props();
</script>

<Accordion.Root type="single" collapsible>
	{#each props.items ?? [] as item}
		<Accordion.Item value={item.props.value}>
			<Accordion.Trigger>{item.props.trigger}</Accordion.Trigger>
			<Accordion.Content>
				{@render renderNode(item.props.content)}
			</Accordion.Content>
		</Accordion.Item>
	{/each}
</Accordion.Root>
