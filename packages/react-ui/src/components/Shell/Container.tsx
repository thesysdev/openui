import clsx from "clsx";
import { useRef } from "react";
import { LayoutContextProvider } from "../../context/LayoutContext";
import { useElementSize } from "../../hooks/useElementSize";
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
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useElementSize({ ref }) || {};
  // TODO: revisit this logic
  const isMobile = width > 0 && width < 768;
  const isFullScreen = width > 768;
  const layout = isMobile ? "mobile" : isFullScreen ? "fullscreen" : "tray";

  return (
    <ShellStoreProvider
      logoUrl={logoUrl}
      agentName={agentName}
      showAssistantLogo={showAssistantLogo}
    >
      <LayoutContextProvider layout={layout}>
        <div
          className={clsx(
            "openui-shell-container",
            {
              "openui-shell-container--mobile": isMobile,
            },
            className,
          )}
          ref={ref}
        >
          {children}
        </div>
      </LayoutContextProvider>
    </ShellStoreProvider>
  );
};
