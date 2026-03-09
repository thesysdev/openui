import "@/app/docs/introduction/page.module.css";
import { OverviewPage } from "@/components/overview-components/overview-page";

export const metadata = {
  title: "Introduction",
  description: "OpenUI is a comprehensive toolkit for building LLM-powered user interfaces.",
};

export default function IntroductionPage() {
  return <OverviewPage />;
}
