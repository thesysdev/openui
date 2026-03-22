"use client";

import type { ComponentGroup, PromptOptions } from "@openuidev/react-lang";
import {
  BuiltinActionType,
  createLibrary,
  defineComponent,
  useTriggerAction,
} from "@openuidev/react-lang";
import { useTheme } from "@/hooks/use-system-theme";
import {
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
} from "@openuidev/react-ui/genui-lib";
import { z } from "zod";

// ── Import everything from the email package ──
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
  emailComponentGroups as packageComponentGroups,
  emailExamples as packageExamples,
  emailAdditionalRules as packageAdditionalRules,
  emailPromptOptions as packagePromptOptions,
} from "@openuidev/react-email";

// ── Chat-specific components ──

const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  props: z.object({
    text: z.string(),
  }),
  description:
    "Clickable follow-up suggestion — when clicked, sends text as user message",
  component: () => null,
});

const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  props: z.object({
    items: z.array(FollowUpItem.ref),
  }),
  description:
    "List of clickable follow-up suggestions placed at the end of a response",
  component: function FollowUpBlockView({ props }) {
    const triggerAction = useTriggerAction();
    const isDark = useTheme() === "dark";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "8px",
        }}
      >
        {items.map((item, i) => {
          const text = String(item?.props?.text ?? "");
          return (
            <button
              key={i}
              onClick={() =>
                triggerAction(text, undefined, {
                  type: BuiltinActionType.ContinueConversation,
                  params: {},
                })
              }
              style={{
                padding: "6px 14px",
                fontSize: "13px",
                borderRadius: "18px",
                border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
                backgroundColor: isDark ? "#1f2937" : "#fff",
                cursor: "pointer",
                color: isDark ? "#e5e7eb" : "#374151",
                transition: "background-color 0.15s",
              }}
            >
              {text}
            </button>
          );
        })}
      </div>
    );
  },
});

const TextContent = defineComponent({
  name: "TextContent",
  props: z.object({
    text: z.string(),
    size: z
      .enum(["small", "default", "large", "small-heavy", "large-heavy"])
      .optional(),
  }),
  description: "Text block for chat messages outside the email preview.",
  component: function TextContentView({ props }) {
    const isDark = useTheme() === "dark";
    const size = (props.size as string) ?? "default";
    const fontSize = size.includes("large")
      ? "18px"
      : size.includes("small")
        ? "13px"
        : "15px";
    const fontWeight = size.includes("heavy") ? "600" : "400";
    return (
      <p
        style={{
          fontSize,
          fontWeight,
          color: isDark ? "#e5e7eb" : "#374151",
          lineHeight: "1.6",
          margin: "0 0 8px 0",
        }}
      >
        {props.text as string}
      </p>
    );
  },
});

// ── Card root ──

const EmailCardChildUnion = z.union([
  EmailTemplate.ref,
  TextContent.ref,
  FollowUpBlock.ref,
  Form.ref,
]);

const EmailCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(EmailCardChildUnion),
  }),
  description:
    "Container for email generator responses. Contains an email template preview and follow-up suggestions.",
  component: ({ props, renderNode }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {renderNode(props.children)}
    </div>
  ),
});

// ── Component groups (email + chat) ──

export const emailComponentGroups: ComponentGroup[] = [
  ...packageComponentGroups,
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

// ── Examples (email + form example) ──

const formExample = `Example 0 — User asks to generate an email (show form first):
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

export const emailExamples: string[] = [formExample, ...packageExamples];

// ── Additional rules (email + form/chat rules) ──

export const emailAdditionalRules: string[] = [
  ...packageAdditionalRules,
  "When the user asks to 'generate an email', 'create an email', or 'make an email' WITHOUT specifying a type or enough details, show a Form first to collect: email type, company name, recipient name, tone, and optional notes. Use Example 0 as the template.",
  "When the user specifies a specific email type directly (e.g. 'create a welcome email for Acme'), skip the form and generate the email directly.",
  "After a form is submitted, the user's message will contain the form field values. Use those values to generate a tailored email. The response after form submission MUST contain an EmailTemplate.",
  "Every response that contains an EmailTemplate MUST also include a FollowUpBlock at the end with 2-3 suggestions for iterating on the email design.",
];

// ── Prompt options ──

export const emailPromptOptions: PromptOptions = {
  examples: emailExamples,
  additionalRules: emailAdditionalRules,
};

// ── Library ──

export const emailChatLibrary = createLibrary({
  root: "Card",
  componentGroups: emailComponentGroups,
  components: ([
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
  ] as any[]),
});
