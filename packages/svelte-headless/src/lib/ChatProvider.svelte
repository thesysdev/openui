<script lang="ts">
  import type { ChatStore } from "./internal";
  import type { Snippet } from "svelte";
  import type { StoreApi } from "zustand";
  import { provideChatStoreContext } from "./context";

  let {
    store,
    children,
  }: {
    store: StoreApi<ChatStore>;
    children?: Snippet;
  } = $props();

  provideChatStoreContext(() => store);
</script>

{@render children?.()}
