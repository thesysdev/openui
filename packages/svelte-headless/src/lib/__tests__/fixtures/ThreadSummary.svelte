<script lang="ts">
  import { getThreadListStore } from "../../stores";

  const threadList = getThreadListStore();
</script>

<p>{$threadList.threads.length}</p>
