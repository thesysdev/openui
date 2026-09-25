import { ExternalTextLink } from "../../components/ExternalTextLink/ExternalTextLink";
import type { GridFeature } from "../../sections/FeatureGridSection/FeatureGridSection";
import { EnterpriseSection } from "../EnterpriseSection";

export function SecuritySection() {
  const features: GridFeature[] = [
    {
      icon: "shield",
      title: "Zero data retention",
      description: "Chat Completions requests use zero data retention by default.",
    },
    {
      icon: "database",
      title: "Your data stays yours",
      description: "Your Gateway data stays private and is never used to train models.",
    },
    {
      icon: "shield",
      title: "Compliance",
      description: (
        <>
          Find GDPR, SOC 2, and ISO 27001 evidence in the{" "}
          <ExternalTextLink href="https://trust.thesys.dev/?utm_source=openui&utm_medium=referral&utm_campaign=openui_to_thesys">
            Trust centre
          </ExternalTextLink>
          {"."}
        </>
      ),
    },
    {
      icon: "cloud",
      title: "Provider fallbacks",
      description: "Gateway switches providers if one fails, keeping the same model.",
    },
    {
      icon: "pulse",
      title: "Live service status",
      description: (
        <>
          View current and historical uptime on our{" "}
          <ExternalTextLink href="https://status.thesys.dev/">service status page</ExternalTextLink>
          {"."}
        </>
      ),
    },
    {
      icon: "devices",
      title: "Private deployment",
      description: "Deploy in your VPC or self-host in your own environment.",
    },
  ];

  return (
    <EnterpriseSection
      title="Built for enterprise requirements"
      titleId="gateway-security"
      features={features}
    />
  );
}
