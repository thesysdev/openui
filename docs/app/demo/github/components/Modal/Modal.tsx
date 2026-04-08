import { IconButton } from "@openuidev/react-ui";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";
import "./Modal.css";

type ModalProps = {
  title: string;
  titleAdornment?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
};

export function Modal({ title, titleAdornment, onClose, children, className }: ModalProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose],
  );

  useEffect(() => {
    if (!onClose) return;
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, handleKey]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-container${className ? ` ${className}` : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-container-header">
          <div className="panel-title-group">
            <span className="panel-title">{title}</span>
            {titleAdornment}
          </div>
          {onClose && (
            <IconButton
              className="panel-icon-btn"
              icon={<X size={16} />}
              variant="tertiary"
              size="extra-small"
              onClick={onClose}
              title="Close"
              aria-label="Close modal"
            />
          )}
        </div>
        <div className="modal-container-body">{children}</div>
      </div>
    </div>
  );
}
