import { createLibrary, defineComponent } from "@openuidev/angular-lang";
import { z } from "zod/v4";
import {
  BarChartComponent,
  CalloutComponent,
  ChecklistComponent,
  ChoiceFormComponent,
  DataTableComponent,
  FollowUpsComponent,
  HeadingComponent,
  MetricsComponent,
  ParagraphComponent,
  ResponseComponent,
} from "./components";
import { definitions } from "./schema";

const renderers = {
  Heading: HeadingComponent,
  Paragraph: ParagraphComponent,
  Metrics: MetricsComponent,
  BarChart: BarChartComponent,
  DataTable: DataTableComponent,
  Callout: CalloutComponent,
  Checklist: ChecklistComponent,
  FollowUps: FollowUpsComponent,
  ChoiceForm: ChoiceFormComponent,
};
const blocks = Object.entries(definitions).map(([name, definition]) =>
  defineComponent<z.ZodObject>({
    name,
    ...definition,
    component: renderers[name as keyof typeof renderers],
  }),
);
const Response = defineComponent({
  name: "Response",
  description: "Root container for every assistant message.",
  props: z.object({ children: z.array(z.union(blocks.map((block) => block.ref))) }),
  component: ResponseComponent,
});
export const library = createLibrary({
  id: "angular-agent-chat",
  root: "Response",
  components: [Response, ...blocks],
});
