import { useThread } from "@openuidev/react-headless";
import {
  Container,
  ConversationStarter,
  Composer as DefaultComposer,
  MessageLoading,
  Messages,
  MobileHeader,
  NewChatButton,
  ScrollArea,
  SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
  ThreadContainer,
  ThreadHeader,
  ThreadList,
  WelcomeScreen,
} from "../Shell";
import { CustomComposerAdapter } from "./CustomComposerAdapter";
import type { SharedChatUIProps } from "./types";
import { isChatEmpty, isWelcomeComponent } from "./utils";
import { withChatProvider } from "./withChatProvider";

const WelcomeMessageRenderer = ({
  welcomeMessage,
  conversationStarters,
}: Pick<SharedChatUIProps, "welcomeMessage" | "conversationStarters">) => {
  const messages = useThread((s) => s.messages);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  if (!welcomeMessage || !isChatEmpty({ isLoadingMessages, messages })) {
    return null;
  }

  if (isWelcomeComponent(welcomeMessage)) {
    const CustomWelcome = welcomeMessage;
    return (
      <WelcomeScreen>
        <CustomWelcome />
      </WelcomeScreen>
    );
  }

  return (
    <WelcomeScreen
      title={welcomeMessage.title}
      description={welcomeMessage.description}
      image={welcomeMessage.image}
      starters={conversationStarters?.options}
      starterVariant={conversationStarters?.variant}
    />
  );
};

const ConversationStartersRenderer = ({
  conversationStarters,
}: Pick<SharedChatUIProps, "conversationStarters">) => {
  const messages = useThread((s) => s.messages);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  if (!conversationStarters || !isChatEmpty({ isLoadingMessages, messages })) {
    return null;
  }

  return (
    <ConversationStarter
      variant={conversationStarters.variant}
      starters={conversationStarters.options}
    />
  );
};

interface FullScreenSpecificProps extends SharedChatUIProps {
  threadHeader?: React.ReactNode;
  mobileHeaderActions?: React.ReactNode;
}

const FullScreenInner = ({
  logoUrl = "https://www.openui.com/favicon.svg",
  agentName = "My Agent",
  messageLoading: MessageLoadingComponent = MessageLoading,
  scrollVariant = "user-message-anchor",
  welcomeMessage,
  conversationStarters,
  assistantMessage,
  userMessage,
  composer: ComposerComponent,
  threadHeader,
  mobileHeaderActions,
}: FullScreenSpecificProps) => {
  return (
    <Container logoUrl={logoUrl} agentName={agentName}>
      <SidebarContainer>
        <SidebarHeader />
        <SidebarContent>
          <NewChatButton />
          <SidebarSeparator />
          <ThreadList />
        </SidebarContent>
      </SidebarContainer>
      <ThreadContainer>
        <MobileHeader rightChildren={mobileHeaderActions} />
        {threadHeader && <ThreadHeader>{threadHeader}</ThreadHeader>}
        <WelcomeMessageRenderer
          welcomeMessage={welcomeMessage}
          conversationStarters={conversationStarters}
        />
        <ScrollArea scrollVariant={scrollVariant}>
          <Messages
            loader={<MessageLoadingComponent />}
            assistantMessage={assistantMessage}
            userMessage={userMessage}
          />
        </ScrollArea>
        <ConversationStartersRenderer conversationStarters={conversationStarters} />
        {ComposerComponent ? (
          <CustomComposerAdapter composer={ComposerComponent} />
        ) : (
          <DefaultComposer />
        )}
      </ThreadContainer>
    </Container>
  );
};

export const FullScreen = withChatProvider<{
  threadHeader?: React.ReactNode;
  mobileHeaderActions?: React.ReactNode;
}>(FullScreenInner);
