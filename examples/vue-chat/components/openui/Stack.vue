<script setup lang="ts">
import { useRenderNode } from "@openuidev/vue-lang";

const { props } = defineProps<{ props: { children?: unknown } }>();
const renderNode = useRenderNode();
</script>

<template>
  <div class="flex flex-col gap-4">
    <component v-if="props.children" :is="() => renderNode(props.children)" />
  </div>
</template>
