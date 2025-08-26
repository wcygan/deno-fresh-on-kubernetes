import type { ComponentChildren } from "preact";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  id?: string;
  onClick?: () => void;
  children?: ComponentChildren;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  class?: string; // allow extra layout utilities (e.g. w-full)
  type?: "button" | "submit" | "reset";
}

export function Button({
  variant = "primary",
  size = "md",
  class: extra,
  ...rest
}: ButtonProps) {
  const classes = [
    "btn",
    `btn-${variant}`,
    size !== "md" ? `btn-${size}` : "",
    extra ?? "",
  ].filter(Boolean).join(" ");

  return <button {...rest} class={classes} />;
}
