import { z } from "zod/v4";
import { EmailArticle } from "./components/Article";
import { EmailAvatarGroup } from "./components/AvatarGroup";
import { EmailAvatarWithText } from "./components/AvatarWithText";
import { EmailBentoGrid } from "./components/BentoGrid";
import { EmailButton } from "./components/Button";
import { EmailCheckoutTable } from "./components/CheckoutTable";
import { EmailCodeBlock } from "./components/CodeBlock";
import { EmailCodeInline } from "./components/CodeInline";
import { EmailCustomerReview } from "./components/CustomerReview";
import { EmailDivider } from "./components/Divider";
import { EmailFeatureGrid } from "./components/FeatureGrid";
import { EmailFeatureList } from "./components/FeatureList";
import { EmailHeading } from "./components/Heading";
import { EmailImage } from "./components/Image";
import { EmailImageGrid } from "./components/ImageGrid";
import { EmailLink } from "./components/Link";
import { EmailList } from "./components/List";
import { EmailMarkdown } from "./components/Markdown";
import { EmailNumberedSteps } from "./components/NumberedSteps";
import { EmailPricingCard } from "./components/PricingCard";
import { EmailProductCard } from "./components/ProductCard";
import { EmailStats } from "./components/Stats";
import { EmailSurveyRating } from "./components/SurveyRating";
import { EmailTestimonial } from "./components/Testimonial";
import { EmailText } from "./components/Text";

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
