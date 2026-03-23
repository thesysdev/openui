"use client";

import type { ComponentGroup, PromptOptions } from "@openuidev/react-lang";
import { createLibrary } from "@openuidev/react-lang";

// ── Email components (from package) ──

import {
  EmailArticle,
  EmailAvatar,
  EmailAvatarGroup,
  EmailAvatarWithText,
  EmailBentoGrid,
  EmailBentoItem,
  EmailButton,
  EmailCheckoutItem,
  EmailCheckoutTable,
  EmailCodeBlock,
  EmailCodeInline,
  EmailColumn,
  EmailColumns,
  EmailCustomerReview,
  EmailDivider,
  EmailFeatureGrid,
  EmailFeatureItem,
  EmailFeatureList,
  EmailFooterCentered,
  EmailFooterTwoColumn,
  EmailHeaderCenteredNav,
  EmailHeaderSideNav,
  EmailHeaderSocial,
  EmailHeading,
  EmailImage,
  EmailImageGrid,
  EmailLink,
  EmailList,
  EmailListItem,
  EmailMarkdown,
  EmailNavLink,
  EmailNumberedSteps,
  EmailPricingCard,
  EmailPricingFeature,
  EmailProductCard,
  EmailSection,
  EmailSocialIcon,
  EmailStatItem,
  EmailStats,
  EmailStepItem,
  EmailSurveyRating,
  EmailTemplate,
  EmailTestimonial,
  EmailText,
  emailComponentGroups,
  emailExamples,
  emailAdditionalRules,
} from "@openuidev/react-email";

// ── Chat components (local) ──

import { EmailCard } from "./chat/EmailCard";
import { FollowUpBlock } from "./chat/FollowUpBlock";
import { FollowUpItem } from "./chat/FollowUpItem";
import { TextContent } from "./chat/TextContent";

// ── Form components (local) ──

import { Button } from "./forms/Button";
import { Buttons } from "./forms/Buttons";
import { Form } from "./forms/Form";
import { FormControl } from "./forms/FormControl";
import { Input } from "./forms/Input";
import { RadioGroup, RadioItem } from "./forms/RadioGroup";
import { Select, SelectItem } from "./forms/Select";
import { TextArea } from "./forms/TextArea";

// ── Additional component groups (forms, buttons, chat) ──

const chatComponentGroups: ComponentGroup[] = [
  {
    name: "Forms",
    components: [
      "Form",
      "FormControl",
      "Input",
      "TextArea",
      "Select",
      "SelectItem",
      "RadioGroup",
      "RadioItem",
    ],
    notes: [
      "- Use Form to collect email details BEFORE generating the email.",
      "- Show a form when the user asks to 'generate an email' or 'create an email' without specifying all details.",
      "- Form requires a name, buttons (Buttons component), and fields (array of FormControl).",
      "- Define EACH FormControl as its own reference — do NOT inline all controls in one array.",
      "- Use Select for email type selection with SelectItem options.",
      "- Use RadioGroup for tone selection (Professional, Friendly, Casual).",
      "- Use Input for text fields (company name, recipient name).",
      "- Use TextArea for additional notes or custom instructions.",
      "- Button with primary variant submits the form and triggers email generation.",
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
  {
    name: "Chat",
    components: ["TextContent", "FollowUpBlock", "FollowUpItem"],
    notes: [
      "- Use TextContent for any chat text outside the email preview.",
      "- Always end with FollowUpBlock to suggest iterations on the email.",
    ],
  },
];

// ── Form example (Example 0) ──

const formExample: string = `Example 0 — User asks to generate an email (show form first):
root = Card([title, form])
title = TextContent("Let's create your email! Fill in the details below.", "large-heavy")
form = Form("emailDetails", btns, [typeField, companyField, recipientField, toneField, notesField])
typeField = FormControl("Email Type", select)
select = Select("emailType", [opt1, opt2, opt3, opt4, opt5, opt6, opt7, opt8, opt9, opt10], "Select an email type...", {required: true})
opt1 = SelectItem("Welcome / Onboarding", "welcome")
opt2 = SelectItem("Newsletter", "newsletter")
opt3 = SelectItem("Order Confirmation", "order_confirmation")
opt4 = SelectItem("Password Reset", "password_reset")
opt5 = SelectItem("Promotional / Sale", "promotional")
opt6 = SelectItem("Event Invitation", "event_invitation")
opt7 = SelectItem("Feedback Request", "feedback_request")
opt8 = SelectItem("Shipping / Delivery Update", "shipping_update")
opt9 = SelectItem("Account Verification", "account_verification")
opt10 = SelectItem("Onboarding Tutorial", "onboarding_tutorial")
companyField = FormControl("Company / Brand Name", companyInput)
companyInput = Input("company", "text", "e.g. Acme Inc", {required: true})
recipientField = FormControl("Recipient Name", recipientInput)
recipientInput = Input("recipient", "text", "e.g. John")
toneField = FormControl("Tone", toneRadio)
toneRadio = RadioGroup("tone", [r1, r2, r3], "professional")
r1 = RadioItem("Professional", "professional")
r2 = RadioItem("Friendly", "friendly")
r3 = RadioItem("Casual", "casual")
notesField = FormControl("Additional Notes (optional)", notesInput)
notesInput = TextArea("notes", "Any specific details, requirements, or content to include...", 3)
btns = Buttons([submitBtn])
submitBtn = Button("Generate Email", "primary")`;

// ── Additional rules for forms/chat ──

const chatAdditionalRules: string[] = [
  "When the user asks to 'generate an email', 'create an email', or 'make an email' WITHOUT specifying a type or enough details, show a Form first to collect: email type, company name, recipient name, tone, and optional notes. Use Example 0 as the template.",
  "When the user specifies a specific email type directly (e.g. 'create a welcome email for Acme'), skip the form and generate the email directly.",
  "After a form is submitted, the user's message will contain the form field values. Use those values to generate a tailored email. The response after form submission MUST contain an EmailTemplate.",
  "Every response that contains an EmailTemplate MUST also include a FollowUpBlock at the end with 2-3 suggestions for iterating on the email design.",
];

// ── Combined prompt options ──

export const emailPromptOptions: PromptOptions = {
  examples: [formExample, ...emailExamples],
  additionalRules: [...emailAdditionalRules, ...chatAdditionalRules],
};

// ── Library ──

export const emailChatLibrary = createLibrary({
  root: "Card",
  componentGroups: [...emailComponentGroups, ...chatComponentGroups],
  components: [
    // Root
    EmailCard,
    // Email structure
    EmailTemplate,
    EmailSection,
    EmailColumns,
    EmailColumn,
    // Email headers
    EmailHeaderSideNav,
    EmailHeaderCenteredNav,
    EmailHeaderSocial,
    EmailNavLink,
    EmailSocialIcon,
    // Email footers
    EmailFooterCentered,
    EmailFooterTwoColumn,
    // Email content
    EmailHeading,
    EmailText,
    EmailButton,
    EmailImage,
    EmailDivider,
    EmailLink,
    EmailCodeBlock,
    EmailCodeInline,
    EmailMarkdown,
    // Email articles & products
    EmailArticle,
    EmailProductCard,
    // Email features & steps
    EmailFeatureItem,
    EmailFeatureGrid,
    EmailFeatureList,
    EmailStepItem,
    EmailNumberedSteps,
    // Email commerce
    EmailCheckoutItem,
    EmailCheckoutTable,
    EmailPricingFeature,
    EmailPricingCard,
    // Email social proof & surveys
    EmailTestimonial,
    EmailSurveyRating,
    EmailStatItem,
    EmailStats,
    // Email image layouts
    EmailImageGrid,
    // Email avatars
    EmailAvatar,
    EmailAvatarGroup,
    EmailAvatarWithText,
    // Email lists
    EmailListItem,
    EmailList,
    // Email reviews
    EmailCustomerReview,
    // Email marketing
    EmailBentoItem,
    EmailBentoGrid,
    // Forms
    Form,
    FormControl,
    Input,
    TextArea,
    Select,
    SelectItem,
    RadioGroup,
    RadioItem,
    Button,
    Buttons,
    // Chat
    TextContent,
    FollowUpBlock,
    FollowUpItem,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any[],
});
