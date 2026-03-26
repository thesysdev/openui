<script setup lang="ts">
import type { ElementNode } from "@openuidev/lang-core";
import { computed, h, onErrorCaptured, ref, type VNode, watch } from "vue";
import { useOpenUI } from "./context.js";

const props = defineProps<{
	node: ElementNode;
}>();

const ctx = useOpenUI();

const componentDef = computed(() => (props.node ? ctx.library.components[props.node.typeName] : null));
const Comp = computed(() => componentDef.value?.component);

const resolvedProps = computed(() => {
	if (!props.node || !componentDef.value) return {};
	if (props.node.props) return props.node.props;

	const args = (props.node as any).args as unknown[] | undefined;
	if (args) {
		const fieldNames = Object.keys(componentDef.value.props.shape);
		const mapped: Record<string, unknown> = {};
		for (let i = 0; i < fieldNames.length && i < args.length; i++) {
			mapped[fieldNames[i]!] = args[i];
		}
		return mapped;
	}

	return {};
});

// ─── Error boundary ───
// Preserves last valid render on error (matches React ErrorBoundary behavior).
const hasError = ref(false);
const lastValidVNode = ref<VNode | null>(null);

onErrorCaptured((err) => {
	console.error("[openui] Component render error:", err);
	hasError.value = true;
	return false; // prevent propagation
});

// Auto-retry when node/props change after a render error (e.g. during streaming).
watch(
	[() => props.node, resolvedProps],
	() => {
		if (hasError.value) {
			hasError.value = false;
		}
	},
);
</script>

<template>
	<component
		v-if="node && Comp && !hasError"
		:is="Comp"
		:props="resolvedProps"
		:renderNode="ctx.renderNode"
	/>
	<!-- Preserve last valid render on error (matches React behavior) -->
	<component v-else-if="hasError && lastValidVNode" :is="() => lastValidVNode" />
</template>
