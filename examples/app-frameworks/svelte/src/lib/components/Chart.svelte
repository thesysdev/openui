<script lang="ts">
	import type { Snippet } from "svelte";
	import {
		Chart as ChartJS,
		CategoryScale,
		LinearScale,
		BarController,
		LineController,
		PieController,
		DoughnutController,
		ArcElement,
		BarElement,
		LineElement,
		PointElement,
		Title,
		Tooltip,
		Legend,
		Filler,
	} from "chart.js";

	ChartJS.register(
		CategoryScale,
		LinearScale,
		BarController,
		LineController,
		PieController,
		DoughnutController,
		ArcElement,
		BarElement,
		LineElement,
		PointElement,
		Title,
		Tooltip,
		Legend,
		Filler,
	);

	let {
		props,
	}: {
		props: {
			title?: string;
			type?: string;
			labels?: string[];
			values?: number[];
			datasetLabel?: string;
		};
		renderNode: Snippet<[unknown]>;
	} = $props();

	let canvas = $state<HTMLCanvasElement>();
	let chartInstance: ChartJS | null = null;

	const COLORS = [
		"rgba(139, 92, 246, 0.7)",
		"rgba(59, 130, 246, 0.7)",
		"rgba(16, 185, 129, 0.7)",
		"rgba(245, 158, 11, 0.7)",
		"rgba(239, 68, 68, 0.7)",
		"rgba(236, 72, 153, 0.7)",
		"rgba(99, 102, 241, 0.7)",
		"rgba(20, 184, 166, 0.7)",
	];

	const BORDER_COLORS = COLORS.map((c) => c.replace("0.7", "1"));

	$effect(() => {
		if (!canvas) return;

		const labels = props.labels ?? [];
		const values = props.values ?? [];
		const chartType = (props.type ?? "bar") as "bar" | "line" | "pie" | "doughnut";
		const isPieType = chartType === "pie" || chartType === "doughnut";

		chartInstance?.destroy();

		chartInstance = new ChartJS(canvas, {
			type: chartType,
			data: {
				labels,
				datasets: [
					{
						label: props.datasetLabel ?? props.title ?? "Data",
						data: values,
						backgroundColor: isPieType
							? COLORS.slice(0, labels.length)
							: COLORS[0],
						borderColor: isPieType
							? BORDER_COLORS.slice(0, labels.length)
							: BORDER_COLORS[0],
						borderWidth: isPieType ? 2 : 2,
						borderRadius: chartType === "bar" ? 6 : undefined,
						tension: chartType === "line" ? 0.3 : undefined,
						fill: chartType === "line" ? "origin" : undefined,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: isPieType, position: "bottom" },
					title: { display: false },
				},
				scales: isPieType
					? {}
					: {
							y: { beginAtZero: true, grid: { color: "rgba(161,161,170,0.15)" } },
							x: { grid: { display: false } },
						},
			},
		});

		return () => {
			chartInstance?.destroy();
			chartInstance = null;
		};
	});
</script>

<div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
	{#if props.title}
		<h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{props.title}</h3>
	{/if}
	<div class="relative h-64">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
