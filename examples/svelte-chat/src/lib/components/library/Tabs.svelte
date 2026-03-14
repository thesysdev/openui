<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";
	import * as Tabs from "$lib/components/ui/tabs/index.js";

	// Parser returns items as ElementNode objects: { type: "element", props: { value, trigger, content } }
	interface TabItemNode {
		props: {
			value: string;
			trigger: string;
			content: unknown[];
		};
	}

	interface Props
		extends ComponentRenderProps<{
			items: TabItemNode[];
		}> {}

	let { props, renderNode }: Props = $props();

	let activeTab = $state(props.items?.[0]?.props.value ?? "");
</script>

<Tabs.Root bind:value={activeTab}>
	<Tabs.List>
		{#each props.items ?? [] as item}
			<Tabs.Trigger value={item.props.value}>{item.props.trigger}</Tabs.Trigger>
		{/each}
	</Tabs.List>
	{#each props.items ?? [] as item}
		<Tabs.Content value={item.props.value}>
			{@render renderNode(item.props.content)}
		</Tabs.Content>
	{/each}
</Tabs.Root>
