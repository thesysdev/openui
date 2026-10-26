import { createPageMetadata } from "@/lib/page-metadata";
import { ComposeExamplePage } from "@components/components/compose";
import { getGuideExampleById } from "@components/config/guide";
import page from "./metadata";

export const metadata = createPageMetadata(page);

export default function CustomizePage() {
  const example = getGuideExampleById("customizing-openui")!;

  return <ComposeExamplePage example={example} />;
}
