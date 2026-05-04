import { useActiveArtifact } from "@openuidev/react-headless";
import clsx from "clsx";
import { ArrowLeftFromLine, ArrowRightFromLine } from "lucide-react";
import { useEffect } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { IconButton } from "../IconButton";
import { useShellStore } from "../_shared/store";

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

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  return (
    <>
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
            "openui-shell-sidebar-container--collapsed": !isSidebarOpen,
            "openui-shell-sidebar-container--hidden": isArtifactActive && !isMobile,
          },
          className,
        )}
      >
        {children}
      </div>
    </>
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

  return (
    <div
      className={clsx(
        "openui-shell-sidebar-header",
        { "openui-shell-sidebar-header--collapsed": !isSidebarOpen },
        className,
      )}
    >
      <div className="openui-shell-sidebar-header__top-row">
        <img src={logoUrl} alt={agentName} className="openui-shell-sidebar-header__logo" />
        <div className="openui-shell-sidebar-header__agent-name">{agentName}</div>
        <IconButton
          icon={
            isSidebarOpen ? <ArrowLeftFromLine size="1em" /> : <ArrowRightFromLine size="1em" />
          }
          onClick={() => {
            setIsSidebarOpen(!isSidebarOpen);
          }}
          size="small"
          variant="secondary"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
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
  const { isSidebarOpen } = useShellStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
  }));

  return (
    <div
      className={clsx("openui-shell-sidebar-content", className, {
        "openui-shell-sidebar-content--collapsed": !isSidebarOpen,
      })}
    >
      {children}
    </div>
  );
};

export const SidebarSeparator = () => {
  return <div className="openui-shell-sidebar-separator" />;
};
