import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ButtonProps {
  href: string;
  text: string;
  size?: "lg";
  variant?: "primary" | "secondary";
}

export function Button({ href, text, size = "lg", variant = "primary" }: ButtonProps) {
  const sizeClasses = size === "lg" ? "openui-button-base-large" : "";
  const variantClasses =
    variant === "primary" ? "openui-button-base-primary" : "openui-button-base-secondary";

  return (
    <Link
      href={href}
      className={`openui-button-base no-underline ${sizeClasses} ${variantClasses}`}
    >
      {text}
      {variant === "primary" && <ArrowRight className="ml-2 h-4 w-4" />}
    </Link>
  );
}
