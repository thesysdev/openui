<script setup lang="ts">
defineProps<{ parts: any[] }>();
</script>

<template>
  <div class="flex justify-end">
    <div
      class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%]"
    >
      <template v-for="(part, i) in parts" :key="i">
        <p v-if="part.type === 'text'" class="text-sm">{{ part.text }}</p>
      </template>
    </div>
  </div>
</template>
