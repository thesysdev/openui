import * as Radio from "@radix-ui/react-radio-group";
import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode, useId } from "react";

export interface RadioItemProps {
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  required?: boolean;
  value: string;
}

const RadioItem = forwardRef<HTMLButtonElement, RadioItemProps>((props, ref) => {
  const { label, description, className, style, disabled, required, value } = props;
  const id = useId();
  return (
    <label htmlFor={id} className="openui-radio-item-container">
      <Radio.Item
        ref={ref}
        id={id}
        className={clsx("openui-radio-item-root", className)}
        value={value}
        disabled={disabled}
        required={required}
        style={style}
      >
        <svg
          width={16}
          height={16}
          fill="none"
          viewBox="0 0 16 16"
          className="openui-radio-item-svg"
        >
          <path // This is the circle that is filled between the border and the circle
            fill="currentColor"
            d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Z"
            className="openui-radio-item-svg-path"
          />
          <path // This is the border
            stroke="currentColor"
            d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Z"
            className="openui-radio-item-svg-border"
          />
          <path // This is the inner circle
            fill="currentColor"
            d="M4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
            className="openui-radio-item-svg-inner"
          />
        </svg>
      </Radio.Item>
      <div className="openui-radio-item-content">
        {label && (
          <label htmlFor={id} className="openui-radio-item-label">
            {label}
          </label>
        )}
        {description && <p className="openui-radio-item-description">{description}</p>}
      </div>
    </label>
  );
});

RadioItem.displayName = "RadioItem";

export { RadioItem };
