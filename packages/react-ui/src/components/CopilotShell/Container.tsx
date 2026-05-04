import clsx from "clsx";
import { LayoutContextProvider } from "../../context/LayoutContext";
import { ShellStoreProvider } from "../_shared/store";

interface ContainerProps {
  children?: React.ReactNode;
  logoUrl: string;
  agentName: string;
  className?: string;
  showAssistantLogo?: boolean;
}

export const Container = ({
  children,
  logoUrl,
  agentName,
  className,
  showAssistantLogo = false,
}: ContainerProps) => {
  return (
    <ShellStoreProvider
      logoUrl={logoUrl}
      agentName={agentName}
      showAssistantLogo={showAssistantLogo}
    >
      <LayoutContextProvider layout="tray">
        <div className={clsx("openui-copilot-shell-container", className)}>{children}</div>
      </LayoutContextProvider>
    </ShellStoreProvider>
  );
};
