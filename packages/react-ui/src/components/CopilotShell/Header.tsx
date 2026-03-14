import clsx from "clsx";
import { ReactNode } from "react";
import { useShellStore } from "../_shared/store";

interface HeaderProps {
  className?: string;
  /** Custom content to render on the rightmost side of the logo container */
  rightChildren?: ReactNode;
}

export const Header = ({ className, rightChildren }: HeaderProps) => {
  const { logoUrl, agentName } = useShellStore((state) => ({
    logoUrl: state.logoUrl,
    agentName: state.agentName,
  }));

  return (
    <div className={clsx("openui-copilot-shell-header", className)}>
      <div className="openui-copilot-shell-header-logo-container">
        <img className="openui-copilot-shell-header-logo" src={logoUrl} alt="Logo" />
        <span className="openui-copilot-shell-header-agent-name">{agentName}</span>
      </div>
      {rightChildren && (
        <div className="openui-copilot-shell-header-right-content">{rightChildren}</div>
      )}
    </div>
  );
};
