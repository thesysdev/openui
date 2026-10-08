type BrandProps = { mode: "light" | "dark" };

// Mascot mark on its own. Used in the collapsed sidebar rail.
export function BrandLogo() {
  return (
    <img
      src="/brand-logo.svg"
      alt="OpenUI"
      className="openui-agent-sidebar-header__logo brand-logo"
    />
  );
}

// "OpenUI" wordmark on its own, no mascot. Used in the expanded sidebar.
export function BrandWordmark({ mode }: BrandProps) {
  return (
    <div className="openui-agent-sidebar-header__agent-name brand-wordmark">
      <img
        src={mode === "dark" ? "/brand-wordmark-text-dark.svg" : "/brand-wordmark-text.svg"}
        alt="OpenUI"
      />
    </div>
  );
}
