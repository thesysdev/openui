<script lang="ts">
  import type { ChatStore } from "../../index";
  import type { StoreApi } from "zustand";
  import ChatProvider from "../../ChatProvider.svelte";
  import ThreadSummary from "./ThreadSummary.svelte";

  let { store }: { store: StoreApi<ChatStore> } = $props();
</script>

<ChatProvider {store}>
  <ThreadSummary />
</ChatProvider>
