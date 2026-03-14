<script lang="ts">
	import type { ComponentRenderProps } from "@openuidev/svelte-lang";

	interface Props
		extends ComponentRenderProps<{
			headers: string[];
			rows: string[][];
		}> {}

	let { props }: Props = $props();
</script>

<div class="w-full overflow-x-auto rounded-lg border">
	<table class="w-full border-collapse text-sm">
		<thead>
			<tr class="border-b bg-muted/50">
				{#each props.headers as header}
					<th class="px-4 py-3 text-left font-medium text-muted-foreground">
						{header}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each props.rows as row}
				<tr class="border-b last:border-b-0 transition-colors hover:bg-muted/50">
					{#each row as cell}
						<td class="px-4 py-3 text-foreground">{cell}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
