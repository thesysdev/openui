import { ComposeExamplePage } from "@components/components/compose";
import { getGuideExampleById } from "@components/config/guide";

export default function ComposePage() {
  const example = getGuideExampleById("prompt-control")!;

  return <ComposeExamplePage example={example} />;
}
