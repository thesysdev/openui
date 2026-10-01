"use client";

import { ThemeProvider } from "@openuidev/react-ui";
import { Renderer } from "@openuidev/react-lang";
import { useState } from "react";
import { f1Theme } from "../f1-typography";
import { library } from "../library";
import { componentSamples } from "./component-samples";
import {
  CarSilhouettePreview,
  CircuitMapPreview,
  CountryFlagPreview,
  DriverAvatarPreview,
  HelmetPreview,
  TeamChipPreview,
  TeamLogoPreview,
} from "./f1-asset-previews";
import { ReferenceColors, ReferenceTypography } from "./f1-reference";
import { FinishLinePreview, TexturePreview } from "./effect-previews";
import { BlockLoadingPreview } from "./stream-settle";
import { Mascot } from "./mascot";
import { Car3DPreview } from "./car-3d";
import { Car3DGlossPreview } from "./car-3d-gloss";
import { RadioInputPreview } from "./radio-input";
import { f1ChartPreviews } from "./f1-charts-special/f1-chart-previews";
import {
  ChatAssistantMessagePreview,
  ChatConversationPreview,
  ChatErrorPreview,
  ChatFollowUpsPreview,
  ChatFollowUpCardsPreview,
  ChatJumpToLatestPreview,
  ChatToolIconsPreview,
  ChatPitWallPreview,
  ChatStartLightsPreview,
  ChatStartersPreview,
  ChatUserMessagePreview,
  ChatWelcomePreview,
} from "./chat/chat-previews";
import {
  SidebarBrandPreview,
  SidebarCollapseButtonPreview,
  SidebarNavItemPreview,
  SidebarPreview,
  SidebarSectionLabelPreview,
  SidebarShellPreview,
  SidebarThreadItemPreview,
} from "./sidebar/sidebar-previews";

function MascotPreview() {
  return (
    <div className="mascot-preview">
      <Mascot size={240} />
      <Mascot size={120} />
      <Mascot size={64} />
      <p className="ref-note">
        Paste your artwork into <code>public/mascot.svg</code>. Use it anywhere with{" "}
        <code>{"<Mascot size={120} />"}</code>.
      </p>
    </div>
  );
}

const references = [
  { name: "Colors", View: ReferenceColors },
  { name: "Typography", View: ReferenceTypography },
  { name: "Mascot", View: MascotPreview },
];

const assets = [
  { name: "TeamChip", View: TeamChipPreview },
  { name: "DriverAvatar", View: DriverAvatarPreview },
  { name: "Helmet", View: HelmetPreview },
  { name: "CircuitMap", View: CircuitMapPreview },
  { name: "CountryFlag", View: CountryFlagPreview },
  { name: "CarSilhouette", View: CarSilhouettePreview },
  { name: "Car3D", View: Car3DPreview },
  { name: "Car3DGloss", View: Car3DGlossPreview },
  { name: "TeamLogo", View: TeamLogoPreview },
];

const radio = [{ name: "RadioInput", View: RadioInputPreview }];

const chat = [
  { name: "Conversation", View: ChatConversationPreview },
  { name: "ChatWelcome", View: ChatWelcomePreview },
  { name: "ChatStarters", View: ChatStartersPreview },
  { name: "ChatUserMessage", View: ChatUserMessagePreview },
  { name: "ChatAssistantMessage", View: ChatAssistantMessagePreview },
  { name: "ChatPitWall", View: ChatPitWallPreview },
  { name: "ChatToolIcons", View: ChatToolIconsPreview },
  { name: "ChatStartLights", View: ChatStartLightsPreview },
  { name: "ChatFollowUps", View: ChatFollowUpsPreview },
  { name: "ChatFollowUpCards", View: ChatFollowUpCardsPreview },
  { name: "ChatError", View: ChatErrorPreview },
  { name: "ChatJumpToLatest", View: ChatJumpToLatestPreview },
];

const sidebar = [
  { name: "Sidebar", View: SidebarPreview },
  { name: "SidebarShell", View: SidebarShellPreview },
  { name: "SidebarBrand", View: SidebarBrandPreview },
  { name: "SidebarCollapseButton", View: SidebarCollapseButtonPreview },
  { name: "SidebarNavItem", View: SidebarNavItemPreview },
  { name: "SidebarSectionLabel", View: SidebarSectionLabelPreview },
  { name: "SidebarThreadItem", View: SidebarThreadItemPreview },
];

const effects = [
  { name: "Texture", View: TexturePreview },
  { name: "FinishLine", View: FinishLinePreview },
  { name: "BlockLoading", View: BlockLoadingPreview },
];

export default function ComponentGallery() {
  const [selectedName, setSelectedName] = useState(componentSamples[0].name);
  const sample = componentSamples.find((s) => s.name === selectedName);
  const reference = [...references, ...assets, ...f1ChartPreviews, ...radio, ...chat, ...sidebar, ...effects].find((r) => r.name === selectedName);

  return (
    <ThemeProvider mode="light" lightTheme={f1Theme}>
      <div className="gallery">
        <nav className="gallery-sidebar">
          <h1>Components</h1>
          {componentSamples.map(({ name }) => (
            <button
              key={name}
              className={name === selectedName ? "active" : undefined}
              onClick={() => setSelectedName(name)}
            >
              {name}
            </button>
          ))}
          <h1 className="gallery-sidebar-section">F1 Charts</h1>
          {f1ChartPreviews.map(({ name }) => (
            <button
              key={name}
              className={name === selectedName ? "active" : undefined}
              onClick={() => setSelectedName(name)}
            >
              {name}
            </button>
          ))}
          <h1 className="gallery-sidebar-section">Reference</h1>
          {references.map(({ name }) => (
            <button
              key={name}
              className={name === selectedName ? "active" : undefined}
              onClick={() => setSelectedName(name)}
            >
              {name}
            </button>
          ))}
          <h1 className="gallery-sidebar-section">Assets</h1>
          {assets.map(({ name }) => (
            <button
              key={name}
              className={name === selectedName ? "active" : undefined}
              onClick={() => setSelectedName(name)}
            >
              {name}
            </button>
          ))}
          <h1 className="gallery-sidebar-section">Radio</h1>
          {radio.map(({ name }) => (
            <button
              key={name}
              className={name === selectedName ? "active" : undefined}
              onClick={() => setSelectedName(name)}
            >
              {name}
            </button>
          ))}
          <h1 className="gallery-sidebar-section">Chat</h1>
          {chat.map(({ name }) => (
            <button
              key={name}
              className={name === selectedName ? "active" : undefined}
              onClick={() => setSelectedName(name)}
            >
              {name}
            </button>
          ))}
          <h1 className="gallery-sidebar-section">Sidebar</h1>
          {sidebar.map(({ name }) => (
            <button
              key={name}
              className={name === selectedName ? "active" : undefined}
              onClick={() => setSelectedName(name)}
            >
              {name}
            </button>
          ))}
          <h1 className="gallery-sidebar-section">Effects</h1>
          {effects.map(({ name }) => (
            <button
              key={name}
              className={name === selectedName ? "active" : undefined}
              onClick={() => setSelectedName(name)}
            >
              {name}
            </button>
          ))}
        </nav>
        <main className="gallery-content">
          <h2>{selectedName}</h2>
          {reference && <reference.View />}
          {sample && (
            <>
              <div className="gallery-preview">
                <Renderer key={sample.name} response={sample.source} library={library} />
              </div>
              <pre className="gallery-source">{sample.source}</pre>
            </>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}
