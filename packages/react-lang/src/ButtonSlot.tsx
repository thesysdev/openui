import React, { useMemo } from "react";

type ButtonProps = React.ComponentPropsWithRef<"button">;

function setRef(ref: React.Ref<HTMLButtonElement> | undefined, node: HTMLButtonElement | null) {
  if (typeof ref === "function") return ref(node);
  if (ref) ref.current = node;
}

/** Apply button behavior to one child without introducing another DOM element. */
export function ButtonSlot({
  children,
  ref,
  onClick,
  disabled,
  className,
  style,
  ...props
}: ButtonProps) {
  const child = React.Children.only(children) as React.ReactElement<ButtonProps>;
  if (child.type === React.Fragment) {
    throw new Error("asChild requires one button, not a Fragment.");
  }
  const childRef = child.props.ref;
  const composedRef = useMemo(() => {
    if (!ref || ref === childRef) return childRef;
    if (!childRef) return ref;
    return (node: HTMLButtonElement | null) => {
      const cleanup = setRef(ref, node);
      const childCleanup = setRef(childRef, node);
      if (node === null) return;
      return () => {
        if (typeof cleanup === "function") cleanup();
        else setRef(ref, null);
        if (typeof childCleanup === "function") childCleanup();
        else setRef(childRef, null);
      };
    };
  }, [ref, childRef]);
  const isDisabled = disabled || child.props.disabled;

  return React.cloneElement(child, {
    ...props,
    ...child.props,
    ref: composedRef,
    disabled: isDisabled,
    className: [className, child.props.className].filter(Boolean).join(" ") || undefined,
    style: { ...style, ...child.props.style },
    onClick(event) {
      if (isDisabled) return;
      child.props.onClick?.(event);
      if (!event.defaultPrevented) onClick?.(event);
    },
  });
}
