import clsx from "clsx";
import { LayoutContextProvider } from "../../context/LayoutContext";
import { ShellStoreProvider } from "../_shared/store";

interface ContainerProps {
  children?: React.ReactNode;
  logoUrl: string;
  agentName: string;
  className?: string;
  showAssistantLogo?: boolean;
  /** Control the open state of the tray */
  isOpen?: boolean;
}

export const Container = ({
  children,
  logoUrl,
  agentName,
  className,
  showAssistantLogo = false,
  isOpen = false,
}: ContainerProps) => {
  return (
    <ShellStoreProvider
      logoUrl={logoUrl}
      agentName={agentName}
      showAssistantLogo={showAssistantLogo}
    >
      <LayoutContextProvider layout="tray">
        <div
          className={clsx(
            "openui-bottom-tray-container",
            {
              "openui-bottom-tray-container--open": isOpen,
              "openui-bottom-tray-container--closed": !isOpen,
            },
            className,
          )}
        >
          {children}
        </div>
      </LayoutContextProvider>
    </ShellStoreProvider>
  );
};
