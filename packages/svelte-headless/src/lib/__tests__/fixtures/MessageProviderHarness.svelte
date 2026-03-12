<script lang="ts">
  import type { Message } from "../../index";
  import MessageProvider from "../../MessageProvider.svelte";
  import MessageSummary from "./MessageSummary.svelte";

  let { message }: { message: Message } = $props();
</script>

<MessageProvider {message}>
  <MessageSummary />
</MessageProvider>
