import { useActiveArtifact } from "@openuidev/react-headless";
import clsx from "clsx";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { IconButton } from "../IconButton";
import { useShellStore } from "../_shared/store";

const SIDEBAR_FADE_DURATION_MS = 90;
const SIDEBAR_RESIZE_DURATION_MS = 160;

type SidebarVisualState = "expanded" | "collapsing" | "collapsed" | "expanding";

const SidebarVisualStateContext = createContext<{
  isCollapsedLayout: boolean;
  visualState: SidebarVisualState;
} | null>(null);

export const useOptionalSidebarVisualState = () => useContext(SidebarVisualStateContext);

const useSidebarVisualState = () => {
  const context = useOptionalSidebarVisualState();
  if (!context) {
    throw new Error("useSidebarVisualState must be used within SidebarContainer");
  }
  return context;
};

export const SidebarContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const { isSidebarOpen, setIsSidebarOpen } = useShellStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));
  const { isArtifactActive } = useActiveArtifact();
  const { layout } = useLayoutContext() || {};
  const isMobile = layout === "mobile";
  const [isCollapsedLayout, setIsCollapsedLayout] = useState(!isSidebarOpen);
  const [visualState, setVisualState] = useState<SidebarVisualState>(
    isSidebarOpen ? "expanded" : "collapsed",
  );
  const animationTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearAnimationTimeouts = () => {
    animationTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    animationTimeoutsRef.current = [];
  };

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    return () => {
      clearAnimationTimeouts();
    };
  }, []);

  useEffect(() => {
    clearAnimationTimeouts();

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
          className={clsx("openui-shell-sidebar-container__overlay", {
            "openui-shell-sidebar-container__overlay--collapsed": !isSidebarOpen,
          })}
          onClick={() => {
            setIsSidebarOpen(false);
          }}
        />
      )}
      <div
        className={clsx(
          "openui-shell-sidebar-container",
          {
            "openui-shell-sidebar-container--collapsed": isCollapsedLayout,
            "openui-shell-sidebar-container--hidden": isArtifactActive && !isMobile,
          },
          className,
        )}
        data-sidebar-visual-state={visualState}
        onClick={() => {
          if (!isMobile && isCollapsedLayout) {
            setIsSidebarOpen(true);
          }
        }}
      >
        {children}
      </div>
    </SidebarVisualStateContext.Provider>
  );
};

export const SidebarHeader = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const { agentName, logoUrl, setIsSidebarOpen, isSidebarOpen } = useShellStore((state) => ({
    agentName: state.agentName,
    logoUrl: state.logoUrl,
    setIsSidebarOpen: state.setIsSidebarOpen,
    isSidebarOpen: state.isSidebarOpen,
  }));
  const { isCollapsedLayout, visualState } = useSidebarVisualState();
  const showExpandedIcon = visualState === "expanded" || visualState === "collapsing";

  return (
    <div
      className={clsx(
        "openui-shell-sidebar-header",
        { "openui-shell-sidebar-header--collapsed": isCollapsedLayout },
        className,
      )}
    >
      <div className="openui-shell-sidebar-header__top-row">
        <img src={logoUrl} alt={agentName} className="openui-shell-sidebar-header__logo" />
        <div className="openui-shell-sidebar-header__agent-name">{agentName}</div>
        <IconButton
          icon={showExpandedIcon ? <PanelLeftClose size="1em" /> : <PanelLeftOpen size="1em" />}
          onClick={() => {
            setIsSidebarOpen(!isSidebarOpen);
          }}
          aria-label={showExpandedIcon ? "Close sidebar" : "Open sidebar"}
          size="small"
          variant="tertiary"
          className="openui-shell-sidebar-header__toggle-button"
        />
      </div>
      {children}
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
  const { isCollapsedLayout } = useSidebarVisualState();

  return (
    <div
      className={clsx(
        "openui-shell-sidebar-content",
        { "openui-shell-sidebar-content--collapsed": isCollapsedLayout },
        className,
      )}
    >
      {children}
    </div>
  );
};

export const SidebarSeparator = () => {
  return null;
};
