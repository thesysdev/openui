// openui-channels: LLM-generated, natively-rendered interactive UI for chat
// platforms. The root export is the platform-agnostic core; platform libraries
// live at subpaths:
//   @openuidev/channels/slack     - Slack Block Kit
//   @openuidev/channels/teams     - Microsoft Teams Adaptive Cards 1.5
//   @openuidev/channels/telegram  - Telegram Bot API rich messages
//   @openuidev/channels/whatsapp  - WhatsApp Cloud API interactive messages
//   @openuidev/channels/ui        - shared UI contracts (types only)
//   @openuidev/channels/ui/charts - chart rasterizer (optional peer deps)
export * from "./core";
