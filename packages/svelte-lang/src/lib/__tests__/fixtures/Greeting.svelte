<script lang="ts">
  import type { ComponentRenderProps } from "../../library";

  interface GreetingProps {
    label: string;
  }

  let { props }: ComponentRenderProps<GreetingProps> = $props();
</script>

<p>{props.label}</p>
