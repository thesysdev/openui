import { z } from "zod";
import { EmailArticle } from "./components/EmailArticle";
import { EmailAvatarGroup } from "./components/EmailAvatarGroup";
import { EmailAvatarWithText } from "./components/EmailAvatarWithText";
import { EmailBentoGrid } from "./components/EmailBentoGrid";
import { EmailButton } from "./components/EmailButton";
import { EmailCheckoutTable } from "./components/EmailCheckoutTable";
import { EmailCodeBlock } from "./components/EmailCodeBlock";
import { EmailCodeInline } from "./components/EmailCodeInline";
import { EmailCustomerReview } from "./components/EmailCustomerReview";
import { EmailDivider } from "./components/EmailDivider";
import { EmailFeatureGrid } from "./components/EmailFeatureGrid";
import { EmailFeatureList } from "./components/EmailFeatureList";
import { EmailHeading } from "./components/EmailHeading";
import { EmailImage } from "./components/EmailImage";
import { EmailImageGrid } from "./components/EmailImageGrid";
import { EmailLink } from "./components/EmailLink";
import { EmailList } from "./components/EmailList";
import { EmailMarkdown } from "./components/EmailMarkdown";
import { EmailNumberedSteps } from "./components/EmailNumberedSteps";
import { EmailPricingCard } from "./components/EmailPricingCard";
import { EmailProductCard } from "./components/EmailProductCard";
import { EmailStats } from "./components/EmailStats";
import { EmailSurveyRating } from "./components/EmailSurveyRating";
import { EmailTestimonial } from "./components/EmailTestimonial";
import { EmailText } from "./components/EmailText";

export const EmailLeafChildUnion = z.union([
  EmailHeading.ref,
  EmailText.ref,
  EmailButton.ref,
  EmailImage.ref,
  EmailDivider.ref,
  EmailLink.ref,
  EmailCodeBlock.ref,
  EmailCodeInline.ref,
  EmailMarkdown.ref,
  EmailArticle.ref,
  EmailProductCard.ref,
  EmailFeatureGrid.ref,
  EmailFeatureList.ref,
  EmailNumberedSteps.ref,
  EmailCheckoutTable.ref,
  EmailPricingCard.ref,
  EmailTestimonial.ref,
  EmailSurveyRating.ref,
  EmailStats.ref,
  EmailImageGrid.ref,
  EmailAvatarGroup.ref,
  EmailAvatarWithText.ref,
  EmailList.ref,
  EmailCustomerReview.ref,
  EmailBentoGrid.ref,
]);
