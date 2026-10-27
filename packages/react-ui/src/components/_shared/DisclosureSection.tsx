import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Collapsed-by-default section for the blocks that close a reply (Related
 * queries, Sources): a small Medium label with a count and a chevron, over a
 * panel that opens to its content's height.
 */
export function DisclosureSection({
  label,
  count,
  preview,
  defaultOpen = false,
  className,
  children,
}: {
  label: string;
  count?: number;
  /** Shown next to the count while collapsed, e.g. stacked favicons. */
  preview?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // A closed panel stays in the DOM for the height animation, so take it out
  // of the tab order and the accessibility tree.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (open) panel.removeAttribute("inert");
    else panel.setAttribute("inert", "");
  }, [open]);

  return (
    <div
      className={clsx(
        "openui-disclosure-section",
        { "openui-disclosure-section--open": open },
        className,
      )}
    >
      <button
        type="button"
        className="openui-disclosure-section__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronRight size={14} className="openui-disclosure-section__chevron" aria-hidden />
        <span className="openui-disclosure-section__label">{label}</span>
        {count !== undefined && <span className="openui-disclosure-section__count">{count}</span>}
        {preview && !open && <span className="openui-disclosure-section__preview">{preview}</span>}
      </button>
      <div
        id={panelId}
        ref={panelRef}
        className="openui-disclosure-section__panel"
        role="region"
        aria-label={label}
      >
        <div className="openui-disclosure-section__panel-inner">
          <div className="openui-disclosure-section__content">{children}</div>
        </div>
      </div>
    </div>
  );
}
