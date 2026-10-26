import { createPageMetadata } from "@/lib/page-metadata";
import { ComposeExamplePage } from "@components/components/compose";
import { getGuideExampleById } from "@components/config/guide";
import page from "./metadata";

export const metadata = createPageMetadata(page);

export default function ComposePage() {
  const example = getGuideExampleById("prompt-control")!;

  return <ComposeExamplePage example={example} />;
}
