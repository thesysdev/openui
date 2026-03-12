<script lang="ts">
  import { getMessageStore } from "../../context";

  const message = getMessageStore();
</script>

<p>{$message.content}</p>
