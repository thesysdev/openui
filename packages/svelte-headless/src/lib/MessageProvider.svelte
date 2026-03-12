<script lang="ts">
  import type { Message } from "./internal";
  import type { Snippet } from "svelte";
  import { writable } from "svelte/store";
  import { provideMessageStoreContext } from "./context";

  let {
    message,
    children,
  }: {
    message: Message;
    children?: Snippet;
  } = $props();

  const messageStore = writable<Message>({
    id: "",
    role: "assistant",
    content: "",
  } as Message);

  provideMessageStoreContext(() => messageStore);

  $effect(() => {
    messageStore.set(message);
  });
</script>

{@render children?.()}
