import { PlusIcon } from "./sidebar-icons";
import "./sidebar.css";

export type SidebarNewChatButtonProps = {
  onClick?: () => void;
  /** The icon-only version that sits on the collapsed rail. */
  rail?: boolean;
};

const LABEL = "New team radio";

/** Starts a new chat: a small Hot Red circle with a warm-white plus. */
export function SidebarNewChatButton({ onClick, rail = false }: SidebarNewChatButtonProps) {
  return (
    <button
      type="button"
      className={rail ? "f1-sidebar-new f1-sidebar-new--rail" : "f1-sidebar-new"}
      aria-label={LABEL}
      onClick={onClick}
    >
      <PlusIcon size={rail ? 12 : 9} />
    </button>
  );
}
