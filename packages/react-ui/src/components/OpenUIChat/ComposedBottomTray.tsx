import { useThread } from "@openuidev/react-headless";
import { useState } from "react";
import {
  Container,
  ConversationStarter,
  Composer as DefaultComposer,
  Header,
  MessageLoading,
  Messages,
  ScrollArea,
  ThreadContainer,
  Trigger,
  WelcomeScreen,
} from "../BottomTray";
import { CustomComposerAdapter } from "./CustomComposerAdapter";
import type { SharedChatUIProps } from "./types";
import { isChatEmpty, isWelcomeComponent } from "./utils";
import { withChatProvider } from "./withChatProvider";

interface BottomTraySpecificProps extends SharedChatUIProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  defaultOpen?: boolean;
}

const WelcomeMessageRenderer = ({ welcomeMessage }: Pick<SharedChatUIProps, "welcomeMessage">) => {
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

const BottomTrayInner = ({
  logoUrl = "https://www.openui.com/favicon.svg",
  agentName = "My Agent",
  messageLoading: MessageLoadingComponent = MessageLoading,
  scrollVariant = "user-message-anchor",
  isArtifactActive,
  renderArtifact,
  isOpen: controlledIsOpen,
  onOpenChange,
  defaultOpen = false,
  welcomeMessage,
  conversationStarters,
  assistantMessage,
  userMessage,
  composer: ComposerComponent,
}: BottomTraySpecificProps) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;

  const handleOpenChange = (newIsOpen: boolean) => {
    if (controlledIsOpen === undefined) {
      setUncontrolledIsOpen(newIsOpen);
    }
    onOpenChange?.(newIsOpen);
  };

  return (
    <>
      <Trigger onClick={() => handleOpenChange(!isOpen)} isOpen={isOpen}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="openui-bottom-tray-trigger-logo" />
        ) : null}
      </Trigger>

      <Container logoUrl={logoUrl} agentName={agentName} isOpen={isOpen}>
        <ThreadContainer isArtifactActive={isArtifactActive} renderArtifact={renderArtifact}>
          <Header onMinimize={() => handleOpenChange(false)} />
          <WelcomeMessageRenderer welcomeMessage={welcomeMessage} />
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
    </>
  );
};

export const BottomTray = withChatProvider<{
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  defaultOpen?: boolean;
}>(BottomTrayInner);
