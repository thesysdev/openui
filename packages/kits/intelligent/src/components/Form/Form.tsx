import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "../../shared/style";

export type FormProps = HTMLAttributes<HTMLDivElement>;

/**
 * Lays fields out freely, like a Col. It renders a div with role="form", not a
 * <form>: react-components' Select adds a hidden native <select> inside a real
 * <form>, and that resets the field's value to empty on load. The chat and
 * dashboard kits do the same.
 */
const Form = forwardRef<HTMLDivElement, FormProps>(({ className, children, ...rest }, ref) => (
  <div ref={ref} role="form" className={cx("openui-intelligent-form", className)} {...rest}>
    {children}
  </div>
));

Form.displayName = "Form";

export { Form };
