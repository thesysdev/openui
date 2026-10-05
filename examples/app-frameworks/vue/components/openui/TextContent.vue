<script setup lang="ts">
defineProps<{ props: { text?: string } }>();
</script>

<template>
  <p class="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{{ props.text ?? "" }}</p>
</template>
