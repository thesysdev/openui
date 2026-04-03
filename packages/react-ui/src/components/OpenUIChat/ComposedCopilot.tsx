import { useThread } from "@openuidev/react-headless";
import {
  Container,
  ConversationStarter,
  Composer as DefaultComposer,
  Header,
  MessageLoading,
  Messages,
  ScrollArea,
  ThreadContainer,
  WelcomeScreen,
} from "../CopilotShell";
import { CustomComposerAdapter } from "./CustomComposerAdapter";
import type { SharedChatUIProps } from "./types";
import { isChatEmpty, isWelcomeComponent } from "./utils";
import { withChatProvider } from "./withChatProvider";

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

interface CopilotSpecificProps extends SharedChatUIProps {
  headerActions?: React.ReactNode;
}

const CopilotInner = ({
  logoUrl = "https://www.openui.com/favicon.svg",
  agentName = "My Agent",
  messageLoading: MessageLoadingComponent = MessageLoading,
  scrollVariant = "user-message-anchor",
  welcomeMessage,
  conversationStarters,
  assistantMessage,
  userMessage,
  composer: ComposerComponent,
  headerActions,
}: CopilotSpecificProps) => {
  return (
    <Container logoUrl={logoUrl} agentName={agentName}>
      <ThreadContainer>
        <Header rightChildren={headerActions} />
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
  );
};

export const Copilot = withChatProvider<{
  headerActions?: React.ReactNode;
}>(CopilotInner);
