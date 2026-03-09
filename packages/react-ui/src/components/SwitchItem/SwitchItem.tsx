import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode, useId } from "react";

interface SwitchItemProps {
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  style?: CSSProperties;
  checked?: boolean;
  disabled?: boolean;
  defaultChecked?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  onChange?: (value: boolean) => void;
}

const SwitchItem = forwardRef<HTMLButtonElement, SwitchItemProps>((props, ref) => {
  const { label, description, onChange, className, disabled, required, ...rest } = props;
  const id = useId();
  return (
    <div className="openui-switch-item-container">
      <Switch.Root
        ref={ref}
        onCheckedChange={onChange}
        id={id}
        className={clsx("openui-switch-item-root", className)}
        disabled={disabled}
        required={required}
        {...rest}
      >
        <Switch.Thumb className="openui-switch-item-thumb" />
      </Switch.Root>
      <div className="openui-switch-item-content">
        {label && (
          <label htmlFor={id} className="openui-switch-item-label">
            {label}
          </label>
        )}
        {description && <p className="openui-switch-item-description">{description}</p>}
      </div>
    </div>
  );
});

SwitchItem.displayName = "SwitchItem";

export { SwitchItem, type SwitchItemProps };
