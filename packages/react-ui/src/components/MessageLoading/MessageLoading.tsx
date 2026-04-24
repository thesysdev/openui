import clsx from "clsx";

export const MessageLoading = ({ className }: { className?: string }) => {
  return (
    <div
      className={clsx("openui-message-loading-container", className)}
      role="status"
      aria-live="polite"
      aria-label="Loading message"
    >
      <div className="openui-message-loading" />
    </div>
  );
};
