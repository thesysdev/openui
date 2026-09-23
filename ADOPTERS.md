# OpenUI Adopters

This list captures the organizations, teams, and frameworks that are using or integrating with OpenUI. If you are an adopter of OpenUI and not yet on this list, we encourage you to add your organization or integration here as well.

The goal for this list is to be a complete and authoritative source for the entire community of OpenUI adopters, and to give inspiration to others that are earlier in their OpenUI journey.

Contributing to this list is a small effort that has a **big impact** on the project's growth, maturity, and momentum. Thank you to all adopters and contributors of OpenUI.

> Adding yourself here is **not** an endorsement of your product by the OpenUI maintainers, and listing here does not imply any commercial relationship.

## Updating this list

To add your organization or integration to this list, [open a PR](https://github.com/thesysdev/openui/pulls) updating this file, or [edit it directly on GitHub](https://github.com/thesysdev/openui/edit/main/ADOPTERS.md).

## Companies and teams

Organizations using OpenUI in their products or internal workflows.

| Organization                                    | Contact                                                                  | Description of Use                                                                                                                                                                                                                                            |
| :---------------------------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Standard Metrics](https://standardmetrics.io/) | [Elias Tounzal](https://github.com/eliasinho)                            | Standard Metrics combines institutional-grade infrastructure with cutting-edge AI to transform portfolio management                                                                                                                                           |
| [Entelligence.AI](https://entelligence.ai)      | [Aiswarya Sankar](https://www.linkedin.com/in/sankaraiswarya/)           | AI platform that gives developers noise-free, self-verifying code reviews to catch bugs before they ship, while providing engineering leaders with the analytics needed to measure the true ROI of their AI coding tools.                                     |
| [GAIA](https://heygaia.io)                      | [Aryan Randeriya](https://github.com/aryanranderiya)                     | GAIA is a proactive personal AI assistant that uses OpenUI Lang to let its backend LLM emit rich, interactive React components inline in chat responses — rendering cards, lists, and other generative UI directly in the conversation instead of plain text. |
| [&facts](https://www.andfacts.com)              | [Sohaib Ahmed](https://www.linkedin.com/in/sohaibacma/)                  | A market insights platform to help eCommerce brands better understand their customers.                                                                                                                                                                        |
| [Oodle](https://www.oodle.ai/)                  | [Gaurav Maheshwari](https://blog.oodle.ai/how-we-taught-our-ai-to-draw/) | Oodle uses OpenUI Lang to let its AI assistant render streaming, composable observability UI for metrics, logs, traces, charts, timelines, and incident investigations.                                                                                       |
| [prox](https://useprox.com/)                    | [Gregory Makodzeba](https://www.linkedin.com/in/gregory-makodzeba/)      | Prox is an AI product-support platform that turns manuals and product data into cited, interactive answers like troubleshooters, selectors, calculators, and guides.                                                                                          |
| [Productboard](https://www.productboard.com/)   | [Patrick Zachar](https://x.com/patrickzachar)                            | Productboard draws from your customer signals, codebase, and strategy to ensure every product decision is grounded, every spec is delivery-ready, and every launch informs your roadmap.                                                                      |
| [Automatio AI](https://automatio.ai/)           | [Kinder • Grinder](https://x.com/kinder_grinder)                         | Automatio is a unified AI agent for any automation that builds and deploys real applications, researches and structures web data, generates media, and runs recurring workflows from plain English prompts.                                                  |

<!--
Example row, copy and edit:

| [Acme Inc.](https://acme.example.com) | [@acme-eng](https://github.com/acme-eng) | Customer-facing AI copilot built on OpenUI Lang. |
-->

## Framework ecosystem

Frameworks that integrate with, support, or generate OpenUI interfaces.

- **assistant-ui** — Renders streaming OpenUI programs as assistant-ui Tool UI while assistant-ui retains control of the conversation and tool lifecycle.

  - Status: `Official integration`
  - [Documentation](https://www.assistant-ui.com/docs/tools/openui) · [Example](https://github.com/assistant-ui/assistant-ui/tree/main/examples/with-openui)

- **Lynx** — Renders OpenUI Lang as cross-platform interfaces through the OpenUI renderer and component library in `@lynx-js/genui`.

  - Status: `Official integration`
  - [Documentation](https://lynxjs.org/next/api/genui/index.html)

- **LangChain** — Generates and renders interactive OpenUI dashboards and reports in LangChain and LangGraph applications.

  - Status: `Official integration`
  - [Documentation](https://docs.langchain.com/oss/python/langchain/frontend/integrations/openui) · [Example](https://github.com/thesysdev/openui/tree/main/examples/agent-frameworks/langgraph-platform)

- **Mastra** — Connects Mastra agent backends to OpenUI's Agent Interface over AG-UI for streaming tool-powered generative interfaces.
  - Status: `Official integration`
  - [Documentation](https://mastra.ai/docs) · [Example](https://github.com/thesysdev/openui/tree/main/examples/agent-frameworks/mastra)

## How to add an entry

For a company or team, open a pull request that adds a row to the table above with:

- **Organization** — name, linked to your homepage or a relevant product page.
- **Contact** — a GitHub handle, email, or link to a blog post / case study / talk. Useful for other adopters reaching out.
- **Description of Use** — one sentence on what you're building with OpenUI.

For a framework integration, add an entry to the framework ecosystem with:

- **Framework** — name and a brief description of the OpenUI integration.
- **Status** — use exactly `Official integration` or `Community integration`.
- **Links** — repository, documentation, and a working example where available.
