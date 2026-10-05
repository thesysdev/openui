import { createOpenUILibrary } from "./define-library";
import Button from "~/components/openui/Button.vue";
import Card from "~/components/openui/Card.vue";
import Chart from "~/components/openui/Chart.vue";
import Stack from "~/components/openui/Stack.vue";
import TextContent from "~/components/openui/TextContent.vue";

export { promptOptions } from "./define-library";

export const library = createOpenUILibrary({
  TextContent,
  Button,
  Chart,
  Card,
  Stack,
});
