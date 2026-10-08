import { useActiveDetailedView } from "@openuidev/react-headless";
import clsx from "clsx";
import { PanelLeft } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { IconButton } from "../IconButton";
import { SidebarResizeEdge } from "./SidebarResizeEdge";
import { AgentInterfaceTooltip } from "./_shared/AgentInterfaceTooltip";
import { SIDEBAR_OPEN_STORAGE_KEY, useAgentInterfaceStore } from "./_shared/store";

const readSavedSidebarOpen = () => {
  try {
    return window.localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const SIDEBAR_FADE_DURATION_MS = 90;
const SIDEBAR_RESIZE_DURATION_MS = 160;

type SidebarVisualState = "expanded" | "collapsing" | "collapsed" | "expanding";

const SidebarVisualStateContext = createContext<{
  isCollapsedLayout: boolean;
  visualState: SidebarVisualState;
} | null>(null);

export const useOptionalSidebarVisualState = () => useContext(SidebarVisualStateContext);

export const SidebarContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const { isSidebarOpen, setIsSidebarOpen } = useAgentInterfaceStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));
  const { isDetailedViewActive } = useActiveDetailedView();
  const { layout } = useLayoutContext() || {};
  const isMobile = layout === "mobile";
  const [isCollapsedLayout, setIsCollapsedLayout] = useState(!isSidebarOpen);
  const [visualState, setVisualState] = useState<SidebarVisualState>(
    isSidebarOpen ? "expanded" : "collapsed",
  );
  const animationTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const previousIsMobileRef = useRef<boolean | null>(null);

  const clearAnimationTimeouts = () => {
    animationTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    animationTimeoutsRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearAnimationTimeouts();
    };
  }, []);

  useEffect(() => {
    clearAnimationTimeouts();

    const isFirstRun = previousIsMobileRef.current === null;
    const justSwitchedLayout = previousIsMobileRef.current !== isMobile;
    previousIsMobileRef.current = isMobile;

    // Mobile always starts closed. On desktop the store already holds the
    // saved choice, so the first run keeps it; coming back from mobile
    // restores it.
    if (justSwitchedLayout) {
      const targetOpen = isMobile ? false : isFirstRun ? isSidebarOpen : readSavedSidebarOpen();
      if (isSidebarOpen !== targetOpen) {
        setIsSidebarOpen(targetOpen);
        return;
      }
    }

    if (!isMobile) {
      try {
        window.localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, isSidebarOpen ? "1" : "0");
      } catch {
        // Storage can be unavailable (private mode, blocked site data).
      }
    }

    if (isMobile) {
      setIsCollapsedLayout(!isSidebarOpen);
      setVisualState(isSidebarOpen ? "expanded" : "collapsed");
      return;
    }

    if (isSidebarOpen) {
      if (visualState === "expanded" && !isCollapsedLayout) {
        return;
      }

      setIsCollapsedLayout(true);
      setVisualState("expanding");

      animationTimeoutsRef.current.push(
        setTimeout(() => {
          setIsCollapsedLayout(false);
          animationTimeoutsRef.current.push(
            setTimeout(() => {
              setVisualState("expanded");
            }, SIDEBAR_RESIZE_DURATION_MS),
          );
        }, SIDEBAR_FADE_DURATION_MS),
      );

      return;
    }

    if (visualState === "collapsed" && isCollapsedLayout) {
      return;
    }

    setIsCollapsedLayout(false);
    setVisualState("collapsing");

    animationTimeoutsRef.current.push(
      setTimeout(() => {
        setIsCollapsedLayout(true);
        animationTimeoutsRef.current.push(
          setTimeout(() => {
            setVisualState("collapsed");
          }, SIDEBAR_RESIZE_DURATION_MS),
        );
      }, SIDEBAR_FADE_DURATION_MS),
    );
  }, [isMobile, isSidebarOpen]);

  const contextValue = useMemo(
    () => ({
      isCollapsedLayout,
      visualState,
    }),
    [isCollapsedLayout, visualState],
  );

  return (
    <SidebarVisualStateContext.Provider value={contextValue}>
      {isMobile && (
        <div
          className={clsx("openui-agent-sidebar-container__overlay", {
            "openui-agent-sidebar-container__overlay--collapsed": !isSidebarOpen,
          })}
          onClick={() => {
            setIsSidebarOpen(false);
          }}
        />
      )}
      <div
        className={clsx(
          "openui-agent-sidebar-container",
          {
            "openui-agent-sidebar-container--collapsed": isCollapsedLayout,
            "openui-agent-sidebar-container--hidden": isDetailedViewActive && !isMobile,
          },
          className,
        )}
        data-sidebar-visual-state={visualState}
      >
        {children}
        {!isMobile && <SidebarResizeEdge />}
      </div>
    </SidebarVisualStateContext.Provider>
  );
};

export interface SidebarHeaderProps {
  className?: string;
  logo?: React.ReactNode;
  agentName?: React.ReactNode;
  collapseButton?: React.ReactNode | false;
  children?: React.ReactNode;
}

export const SidebarHeader = ({
  className,
  logo,
  agentName: agentNameProp,
  collapseButton,
  children,
}: SidebarHeaderProps) => {
  const {
    agentName: ctxAgentName,
    logoUrl,
    setIsSidebarOpen,
    isSidebarOpen,
  } = useAgentInterfaceStore((state) => ({
    agentName: state.agentName,
    logoUrl: state.logoUrl,
    setIsSidebarOpen: state.setIsSidebarOpen,
    isSidebarOpen: state.isSidebarOpen,
  }));
  const sidebarVisualState = useOptionalSidebarVisualState();
  const isCollapsedLayout = sidebarVisualState?.isCollapsedLayout ?? !isSidebarOpen;

  if (children != null) {
    if (
      typeof process !== "undefined" &&
      process.env?.["NODE_ENV"] !== "production" &&
      (logo !== undefined || agentNameProp !== undefined || collapseButton !== undefined)
    ) {
      console.warn(
        "[AgentInterface] <AgentInterface.SidebarHeader> received both children and override props; children win.",
      );
    }
    return (
      <div
        className={clsx(
          "openui-agent-sidebar-header",
          { "openui-agent-sidebar-header--collapsed": isCollapsedLayout },
          className,
        )}
      >
        {children}
      </div>
    );
  }

  const defaultLogo = logoUrl ? (
    <img src={logoUrl} alt={ctxAgentName} className="openui-agent-sidebar-header__logo" />
  ) : null;
  const defaultAgentName = (
    <div className="openui-agent-sidebar-header__agent-name">{ctxAgentName}</div>
  );
  const defaultCollapseButton = (
    <AgentInterfaceTooltip
      content={isCollapsedLayout ? "Open sidebar" : "Close sidebar"}
      side="right"
    >
      <IconButton
        icon={<PanelLeft size="1em" strokeWidth={2} />}
        onClick={(e) => {
          e.stopPropagation();
          setIsSidebarOpen(!isSidebarOpen);
        }}
        size="small"
        variant="tertiary"
        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="openui-agent-sidebar-header__toggle-button"
      />
    </AgentInterfaceTooltip>
  );

  return (
    <div
      className={clsx(
        "openui-agent-sidebar-header",
        { "openui-agent-sidebar-header--collapsed": isCollapsedLayout },
        className,
      )}
    >
      <div className="openui-agent-sidebar-header__top-row">
        {logo ?? defaultLogo}
        {agentNameProp ?? defaultAgentName}
        {collapseButton === false ? null : (collapseButton ?? defaultCollapseButton)}
      </div>
    </div>
  );
};

export const SidebarContent = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const isSidebarOpen = useAgentInterfaceStore((state) => state.isSidebarOpen);
  const sidebarVisualState = useOptionalSidebarVisualState();
  const isCollapsedLayout = sidebarVisualState?.isCollapsedLayout ?? !isSidebarOpen;

  return (
    <div
      className={clsx("openui-agent-sidebar-content", className, {
        "openui-agent-sidebar-content--collapsed": isCollapsedLayout,
      })}
    >
      {children}
    </div>
  );
};

export const SidebarSeparator = () => {
  return <div className="openui-agent-sidebar-separator" />;
};
