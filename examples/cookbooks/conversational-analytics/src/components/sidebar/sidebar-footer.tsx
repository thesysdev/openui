import "./sidebar.css";

/**
 * The credit at the foot of the sidebar: "Created with ⚡ by [logo] OpenUI", linking to openui.com.
 * Collapsed, only the logo stays, on the icon column.
 */
export function SidebarFooter() {
  return (
    <a className="f1-sidebar-footer" href="https://www.openui.com" target="_blank" rel="noopener noreferrer" aria-label="Created with speed by OpenUI">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="f1-sidebar-footer__logo" src="/openui-logo.svg" alt="" width={20} height={19} />
      <span className="f1-sidebar-footer__text">
        Created with <span aria-hidden>⚡</span> by <strong>OpenUI</strong>
      </span>
    </a>
  );
}
