import * as Checkbox from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode, useId } from "react";

export interface CheckBoxItemProps {
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  style?: CSSProperties;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  onChange?: (checked: boolean) => void;
}

const CheckBoxItem = forwardRef<HTMLButtonElement, CheckBoxItemProps>((props, ref) => {
  const { label, description, onChange, className, disabled, required, ...rest } = props;
  const id = useId();
  return (
    <label htmlFor={id} className="openui-checkbox-item-container">
      <Checkbox.Root
        {...rest}
        ref={ref}
        onCheckedChange={onChange}
        id={id}
        className={clsx("openui-checkbox-item-root", className)}
        disabled={disabled}
        required={required}
      >
        <Checkbox.Indicator className="openui-checkbox-item-indicator">
          <svg
            width="10"
            height="8"
            viewBox="0 0 10 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 1L3.5 6.5L1 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Root>
      <div className="openui-checkbox-item-content">
        {label && (
          <label htmlFor={id} className="openui-checkbox-item-label">
            {label}
          </label>
        )}
        {description && <p className="openui-checkbox-item-description">{description}</p>}
      </div>
    </label>
  );
});

CheckBoxItem.displayName = "CheckBoxItem";

export { CheckBoxItem };
