# @openuidev/react-email

React Email components for [OpenUI](https://openui.com) — 44 email building blocks defined with `defineComponent`, ready for LLM-driven email generation.

[![npm](https://img.shields.io/npm/v/@openuidev/react-email)](https://www.npmjs.com/package/@openuidev/react-email)
[![npm downloads](https://img.shields.io/npm/dm/@openuidev/react-email)](https://www.npmjs.com/package/@openuidev/react-email)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

## Install

```bash
npm install @openuidev/react-email @openuidev/react-lang
# or
pnpm add @openuidev/react-email @openuidev/react-lang
```

**Peer dependencies:** `react >=19.0.0`, `react-dom >=19.0.0`, `@openuidev/react-lang`

## Overview

`@openuidev/react-email` provides a complete component library for generating email templates via OpenUI Lang. It includes:

1. **44 email components** — Headers, footers, content blocks, commerce elements, social proof, and more — all defined with `defineComponent` and Zod-validated props.
2. **Pre-built library** — `emailLibrary` is a ready-to-use `createLibrary()` instance with all components registered and categorized.
3. **Prompt configuration** — `emailPromptOptions` includes 10 email template examples and 30+ rules for high-quality email generation.

## Quick Start

### 1. Generate a system prompt

```ts
import { emailLibrary, emailPromptOptions } from "@openuidev/react-email";

const systemPrompt = emailLibrary.prompt(emailPromptOptions);
```

### 2. Render the email output

```tsx
import { Renderer } from "@openuidev/react-lang";
import { emailLibrary } from "@openuidev/react-email";

function EmailPreview({ response, isStreaming }) {
  return (
    <Renderer
      response={response}
      library={emailLibrary}
      isStreaming={isStreaming}
    />
  );
}
```

The root component is `EmailTemplate`, which renders a live email preview with a **Copy HTML** export button.

## Components

44 components organized into 13 categories:

| Category | Components |
| :--- | :--- |
| **Structure** | `EmailTemplate`, `EmailSection`, `EmailColumns`, `EmailColumn` |
| **Headers** | `EmailHeaderSideNav`, `EmailHeaderCenteredNav`, `EmailHeaderSocial`, `EmailNavLink`, `EmailSocialIcon` |
| **Footers** | `EmailFooterCentered`, `EmailFooterTwoColumn` |
| **Content** | `EmailHeading`, `EmailText`, `EmailButton`, `EmailImage`, `EmailDivider`, `EmailLink`, `EmailCodeBlock`, `EmailCodeInline`, `EmailMarkdown` |
| **Articles & Products** | `EmailArticle`, `EmailProductCard` |
| **Features & Steps** | `EmailFeatureItem`, `EmailFeatureGrid`, `EmailFeatureList`, `EmailStepItem`, `EmailNumberedSteps` |
| **Commerce** | `EmailCheckoutItem`, `EmailCheckoutTable`, `EmailPricingCard`, `EmailPricingFeature` |
| **Social Proof & Surveys** | `EmailTestimonial`, `EmailSurveyRating`, `EmailStatItem`, `EmailStats` |
| **Image Layouts** | `EmailImageGrid` |
| **Avatars** | `EmailAvatar`, `EmailAvatarGroup`, `EmailAvatarWithText` |
| **Lists** | `EmailListItem`, `EmailList` |
| **Reviews** | `EmailCustomerReview` |
| **Marketing** | `EmailBentoItem`, `EmailBentoGrid` |

### Data-only vs. Composite components

Some components are **data-only** — they return `null` and act as structured data containers for their parent:

- `EmailNavLink`, `EmailSocialIcon`, `EmailFeatureItem`, `EmailStepItem`, `EmailCheckoutItem`, `EmailPricingFeature`, `EmailStatItem`, `EmailListItem`, `EmailBentoItem`

Their parent **composite components** (e.g., `EmailFeatureGrid`, `EmailCheckoutTable`, `EmailStats`) iterate over these children and handle the rendering.

## Supported Email Types

The built-in prompt options include examples for 10 common email types:

1. Welcome / Onboarding
2. Newsletter
3. Order Confirmation
4. Password Reset
5. Promotional / Sale
6. Event Invitation
7. Feedback Request
8. Shipping / Delivery Update
9. Account Verification
10. Onboarding Tutorial

## Exports

| Export | Description |
| :--- | :--- |
| `emailLibrary` | Pre-configured `Library` instance with all 44 components |
| `emailPromptOptions` | Prompt options with examples and rules for email generation |

## Documentation

Full documentation, guides, and the language specification are available at **[openui.com](https://openui.com)**.

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
