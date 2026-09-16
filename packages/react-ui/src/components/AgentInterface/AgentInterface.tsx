import {
  ChatProvider,
  useActiveDetailedView,
  useArtifactList,
  useArtifactStorage,
  useThreadList,
  type Artifact,
  type AssistantMessage,
  type ChatProviderProps,
  type UserMessage,
} from "@openuidev/react-headless";
import type { Library } from "@openuidev/react-lang";
import { ArrowLeft, MessageSquare } from "lucide-react";
import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactElement,
  type ReactNode,
} from "react";
import type { ScrollVariant } from "../../hooks/useScrollToBottom";
import type { ConversationStarterProps } from "../../types/ConversationStarter";
import { IconButton } from "../IconButton";
import { GenUIAssistantMessage } from "../OpenUIChat/GenUIAssistantMessage";
import { GenUIUserMessage } from "../OpenUIChat/GenUIUserMessage";
import { ThemeProvider, type ThemeProps } from "../ThemeProvider";
import { AgentInterfaceTooltip } from "./_shared/AgentInterfaceTooltip";
import { artifactListPath, parseArtifactPath } from "./_shared/artifactPaths";
import { GalleryHorizontalEndIcon } from "./_shared/GalleryHorizontalEndIcon";
import {
  LabelsProvider,
  useAgentInterfaceLabels,
  type AgentInterfaceLabels,
} from "./_shared/labelsContext";
import { NavProvider, useNav } from "./_shared/navContext";
import { StartersProvider } from "./_shared/startersContext";
import { useAgentInterfaceStore } from "./_shared/store";
import type { AssistantMessageComponent, UserMessageComponent } from "./_shared/types";
import { ArtifactBrowserPage } from "./ArtifactBrowserPage";
import { ArtifactNav } from "./ArtifactNav";
import { ArtifactViewPage } from "./ArtifactViewPage";
import { Composer } from "./Composer";
import { Container } from "./Container";
import { type ConversationStarterVariant } from "./ConversationStarter";
import { MobileHeader } from "./MobileHeader";
import { NewChatButton } from "./NewChatButton";
import { Route } from "./Route";
import { SidebarContainer, SidebarContent, SidebarHeader, SidebarSeparator } from "./Sidebar";
import { SidebarItem } from "./SidebarItem";
import { SidebarSlot } from "./SidebarSlot";
import { MessageLoading, Messages, ScrollArea, ThreadContainer, ThreadHeader } from "./Thread";
import { ThreadList } from "./ThreadList";
import { WelcomeGlow } from "./WelcomeGlow";
import { WelcomeScreen } from "./WelcomeScreen";
import { Workspace } from "./Workspace";

export interface AgentInterfaceComponents {
  AssistantMessage?: AssistantMessageComponent;
  UserMessage?: UserMessageComponent;
}

export interface AgentInterfaceProps extends Omit<ChatProviderProps, "children"> {
  /** Component library for auto-GenUI rendering when `components.AssistantMessage` is not provided. */
  componentLibrary?: Library;
  /** Explicit component overrides. Takes precedence over GenUI auto-derivation. */
  components?: AgentInterfaceComponents;
  /** Theme props passed to <ThemeProvider>. */
  theme?: ThemeProps;
  /** When true, skips wrapping in <ThemeProvider>. */
  disableThemeProvider?: boolean;
  /** Brand logo shown in default SidebarHeader + MobileHeader. */
  logoUrl?: string;
  /** Agent display name. */
  agentName?: string;
  /** Consumer-overridable display strings for the artifact browser + workspace. */
  labels?: AgentInterfaceLabels;
  /** Global starters inherited by Welcome (when active) or Composer. */
  starters?: ConversationStarterProps[];
  /** Layout variant for inherited starters. */
  starterVariant?: ConversationStarterVariant;
  /** Controlled current path. Pair with `onNavigate`. `undefined` = thread view. */
  path?: string;
  /** Initial path for uncontrolled mode. Ignored when `onNavigate` is provided. */
  defaultPath?: string;
  /** Called when navigation occurs. Presence selects controlled mode. */
  onNavigate?: (next: string | undefined) => void;
  /**
   * How the thread scrolls as messages stream in.
   * `"always"` follows the streaming response to the bottom (until the user scrolls up);
   * `"user-message-anchor"` (default) pins the latest user message to the top.
   */
  scrollVariant?: ScrollVariant;
  /** When false, the thread does not auto-scroll on load / conversation switch (auto-scroll only while generating). Default true. */
  scrollOnLoad?: boolean;
  children?: ReactNode;
}

interface ExtractedSlots {
  sidebar?: ReactElement;
  sidebarHeader?: ReactElement;
  mobileHeader?: ReactElement;
  threadHeader?: ReactElement;
  welcome?: ReactElement;
  composer?: ReactElement;
  workspace?: ReactElement;
  routes: ReactElement[];
  rest: ReactNode[];
}

type SingleSlotKey = Exclude<keyof ExtractedSlots, "rest" | "routes">;

const SLOT_KEY_BY_TYPE = new Map<unknown, SingleSlotKey>([
  [SidebarSlot, "sidebar"],
  [SidebarHeader, "sidebarHeader"],
  [MobileHeader, "mobileHeader"],
  [ThreadHeader, "threadHeader"],
  [WelcomeScreen, "welcome"],
  [Composer, "composer"],
  [Workspace, "workspace"],
]);

const isDev = () => typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production";

function extractSlots(children: ReactNode): ExtractedSlots {
  const result: ExtractedSlots = { routes: [], rest: [] };
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      result.rest.push(child);
      return;
    }
    if (child.type === Route) {
      result.routes.push(child);
      return;
    }
    const key = SLOT_KEY_BY_TYPE.get(child.type);
    if (!key) {
      result.rest.push(child);
      return;
    }
    if (result[key]) {
      if (isDev()) {
        console.warn(
          `[AgentInterface] Multiple <AgentInterface.${key}> slot children — using the first; ignoring the rest.`,
        );
      }
      return;
    }
    result[key] = child;
  });
  return result;
}

const DummyThemeProvider = ({ children }: { children: ReactNode }) => <>{children}</>;

interface AgentInterfaceComponent extends FC<AgentInterfaceProps> {
  Sidebar: typeof SidebarSlot;
  SidebarHeader: typeof SidebarHeader;
  SidebarContent: typeof SidebarContent;
  SidebarSeparator: typeof SidebarSeparator;
  SidebarItem: typeof SidebarItem;
  ArtifactNav: typeof ArtifactNav;
  Workspace: typeof Workspace;
  Route: typeof Route;
  MobileHeader: typeof MobileHeader;
  ThreadHeader: typeof ThreadHeader;
  Welcome: typeof WelcomeScreen;
  WelcomeGlow: typeof WelcomeGlow;
  Composer: typeof Composer;
  NewChatButton: typeof NewChatButton;
  ThreadList: typeof ThreadList;
  Messages: typeof Messages;
  MessageLoading: typeof MessageLoading;
  ScrollArea: typeof ScrollArea;
}

export const AgentInterface: AgentInterfaceComponent = ((props: AgentInterfaceProps) => {
  const {
    storage,
    llm,
    artifactRenderers,
    artifactCategories,
    artifactAutoOpen,
    componentLibrary,
    components,
    theme,
    disableThemeProvider,
    logoUrl,
    agentName,
    labels,
    starters,
    starterVariant,
    path,
    defaultPath,
    onNavigate,
    scrollVariant,
    scrollOnLoad,
    children,
  } = props;

  const slots = useMemo(() => extractSlots(children), [children]);

  if (slots.sidebar && slots.sidebarHeader) {
    if (isDev()) {
      console.warn(
        "[AgentInterface] <AgentInterface.SidebarHeader> at top level is ignored because <AgentInterface.Sidebar> is provided. Put SidebarHeader inside Sidebar instead.",
      );
    }
    slots.sidebarHeader = undefined;
  }

  const resolvedAssistantMessage = useMemo<AssistantMessageComponent | undefined>(() => {
    if (components?.AssistantMessage) return components.AssistantMessage;
    if (componentLibrary) {
      const Cmp = ({
        message,
        isStreaming,
      }: {
        message: AssistantMessage;
        isStreaming: boolean;
      }) => (
        <GenUIAssistantMessage
          message={message}
          library={componentLibrary}
          isStreaming={isStreaming}
        />
      );
      return Cmp;
    }
    return undefined;
  }, [components?.AssistantMessage, componentLibrary]);

  const resolvedUserMessage = useMemo<UserMessageComponent | undefined>(() => {
    if (components?.UserMessage) return components.UserMessage;
    if (componentLibrary) {
      const Cmp = ({ message }: { message: UserMessage }) => <GenUIUserMessage message={message} />;
      return Cmp;
    }
    return undefined;
  }, [components?.UserMessage, componentLibrary]);

  const ThemeProviderComponent = disableThemeProvider ? DummyThemeProvider : ThemeProvider;

  return (
    <ThemeProviderComponent {...theme}>
      <ChatProvider
        storage={storage}
        llm={llm}
        artifactRenderers={artifactRenderers}
        artifactCategories={artifactCategories}
        artifactAutoOpen={artifactAutoOpen}
      >
        <NavProvider path={path} defaultPath={defaultPath} onNavigate={onNavigate}>
          <StartersProvider starters={starters} starterVariant={starterVariant}>
            <LabelsProvider labels={labels}>
              <AgentInterfaceBody
                slots={slots}
                logoUrl={logoUrl ?? ""}
                agentName={agentName ?? ""}
                resolvedAssistantMessage={resolvedAssistantMessage}
                resolvedUserMessage={resolvedUserMessage}
                scrollVariant={scrollVariant}
                scrollOnLoad={scrollOnLoad}
              />
            </LabelsProvider>
          </StartersProvider>
        </NavProvider>
      </ChatProvider>
    </ThemeProviderComponent>
  );
}) as AgentInterfaceComponent;

interface AgentInterfaceBodyProps {
  slots: ExtractedSlots;
  logoUrl: string;
  agentName: string;
  resolvedAssistantMessage: AssistantMessageComponent | undefined;
  resolvedUserMessage: UserMessageComponent | undefined;
  scrollVariant?: ScrollVariant;
  scrollOnLoad?: boolean;
}

const ArtifactViewMobileHeader = ({
  artifactId,
  categoryName,
}: {
  artifactId: string;
  categoryName?: string;
}) => {
  const storage = useArtifactStorage();
  const selectThread = useThreadList(
    (s: { selectThread: (threadId: string) => void }) => s.selectThread,
  );
  const { navigate } = useNav();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!storage) {
      setArtifact(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setArtifact(null);
    storage
      .get(artifactId)
      .then((a: Artifact) => {
        if (requestId !== requestIdRef.current) return;
        setArtifact(a);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setArtifact(null);
      });
  }, [storage, artifactId]);

  const backToList = () => navigate(artifactListPath(categoryName));
  const goToThread = () => {
    if (!artifact) return;
    selectThread(artifact.threadId);
    navigate(undefined);
  };

  return (
    <MobileHeader
      menuButton={
        <IconButton
          size="medium"
          icon={<ArrowLeft size="1em" />}
          onClick={backToList}
          variant="secondary"
          aria-label="Back to artifacts"
        />
      }
      agentName={
        <span className="openui-agent-mobile-header-agent-name">{artifact?.title ?? ""}</span>
      }
      newChatButton={
        <IconButton
          size="medium"
          icon={<MessageSquare size="1em" />}
          onClick={goToThread}
          variant="secondary"
          aria-label="Go to thread"
          disabled={!artifact}
        />
      }
    />
  );
};

const MobileWorkspaceToggleButton = () => {
  const artifacts = useArtifactList();
  const { isDetailedViewActive } = useActiveDetailedView();
  const { workspaceToggle } = useAgentInterfaceLabels();
  const { isWorkspaceOpen, setIsWorkspaceOpen } = useAgentInterfaceStore((state) => ({
    isWorkspaceOpen: state.isWorkspaceOpen,
    setIsWorkspaceOpen: state.setIsWorkspaceOpen,
  }));
  const hasArtifacts = Object.keys(artifacts).length > 0;

  if (!hasArtifacts || isDetailedViewActive) return null;

  return (
    <AgentInterfaceTooltip content={workspaceToggle} side="left">
      <IconButton
        size="medium"
        icon={<GalleryHorizontalEndIcon size="1em" />}
        onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
        variant="secondary"
        aria-label={isWorkspaceOpen ? "Collapse workspace" : "Expand workspace"}
      />
    </AgentInterfaceTooltip>
  );
};

const AgentInterfaceBody = ({
  slots,
  logoUrl,
  agentName,
  resolvedAssistantMessage,
  resolvedUserMessage,
  scrollVariant,
  scrollOnLoad,
}: AgentInterfaceBodyProps) => {
  const { path } = useNav();

  // Reserved `artifacts/` prefix is matched BEFORE user-defined Routes.
  const artifactPath = useMemo(() => (path === undefined ? null : parseArtifactPath(path)), [path]);

  const activeRoute = useMemo(() => {
    if (path === undefined || artifactPath) return undefined;
    return slots.routes.find((route) => (route.props as { path: string }).path === path);
  }, [path, artifactPath, slots.routes]);

  return (
    <Container logoUrl={logoUrl} agentName={agentName}>
      <SidebarContainer>
        {slots.sidebar ? (
          (slots.sidebar.props as { children?: ReactNode }).children
        ) : (
          <>
            <div className="openui-agent-sidebar-actions">
              {slots.sidebarHeader ?? <SidebarHeader />}
              <div className="openui-agent-sidebar-primary-actions">
                <NewChatButton />
                <ArtifactNav className="openui-agent-sidebar-artifact-nav" />
              </div>
            </div>
            <SidebarContent>
              <ThreadList />
            </SidebarContent>
          </>
        )}
      </SidebarContainer>
      {artifactPath ? (
        <ThreadContainer>
          {slots.mobileHeader ??
            (artifactPath.kind === "view" ? (
              <ArtifactViewMobileHeader
                artifactId={artifactPath.artifactId}
                categoryName={artifactPath.categoryName}
              />
            ) : (
              <MobileHeader />
            ))}
          {artifactPath.kind === "list" ? (
            // Keyed on category so switching categories remounts with fresh
            // state instead of rendering the previous category's list while the
            // new one loads.
            <ArtifactBrowserPage
              key={artifactPath.categoryName ?? "__all__"}
              categoryName={artifactPath.categoryName}
            />
          ) : (
            <ArtifactViewPage
              artifactId={artifactPath.artifactId}
              categoryName={artifactPath.categoryName}
            />
          )}
        </ThreadContainer>
      ) : activeRoute ? (
        <ThreadContainer>
          {(activeRoute.props as { children?: ReactNode }).children}
        </ThreadContainer>
      ) : (
        <>
          <ThreadContainer>
            {slots.mobileHeader ?? <MobileHeader actions={<MobileWorkspaceToggleButton />} />}
            {slots.threadHeader ?? <ThreadHeader />}
            {slots.welcome}
            <ScrollArea scrollVariant={scrollVariant} scrollOnLoad={scrollOnLoad}>
              <Messages
                loader={<MessageLoading />}
                assistantMessage={resolvedAssistantMessage}
                userMessage={resolvedUserMessage}
              />
            </ScrollArea>
            {slots.composer ?? <Composer />}
          </ThreadContainer>
          {/* Per-thread workspace rail — thread view only (hidden on Route/artifact pages). */}
          {slots.workspace ?? <Workspace />}
        </>
      )}
      {slots.rest}
    </Container>
  );
};

AgentInterface.Sidebar = SidebarSlot;
AgentInterface.SidebarHeader = SidebarHeader;
AgentInterface.SidebarContent = SidebarContent;
AgentInterface.SidebarSeparator = SidebarSeparator;
AgentInterface.SidebarItem = SidebarItem;
AgentInterface.ArtifactNav = ArtifactNav;
AgentInterface.Workspace = Workspace;
AgentInterface.Route = Route;
AgentInterface.MobileHeader = MobileHeader;
AgentInterface.ThreadHeader = ThreadHeader;
AgentInterface.Welcome = WelcomeScreen;
AgentInterface.WelcomeGlow = WelcomeGlow;
AgentInterface.Composer = Composer;
AgentInterface.NewChatButton = NewChatButton;
AgentInterface.ThreadList = ThreadList;
AgentInterface.Messages = Messages;
AgentInterface.MessageLoading = MessageLoading;
AgentInterface.ScrollArea = ScrollArea;
