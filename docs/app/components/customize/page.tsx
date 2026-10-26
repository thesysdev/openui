import { ComposeExamplePage } from "@components/components/compose";
import { getGuideExampleById } from "@components/config/guide";

export default function CustomizePage() {
  const example = getGuideExampleById("customizing-openui")!;

  return <ComposeExamplePage example={example} />;
}
