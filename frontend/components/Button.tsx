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
  loading?: boolean;
  success?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  class: extra,
  loading = false,
  success = false,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    "btn",
    `btn-${variant}`,
    size !== "md" ? `btn-${size}` : "",
    "relative",
    extra ?? "",
  ].filter(Boolean).join(" ");

  return (
    <button
      {...rest}
      class={classes}
      disabled={disabled || loading}
    >
      <span
        class={`inline-flex items-center justify-center ${
          loading || success ? "opacity-0" : ""
        }`}
      >
        {children}
      </span>
      {loading && (
        <span class="absolute inset-0 flex items-center justify-center">
          <svg
            class="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      {success && (
        <span class="absolute inset-0 flex items-center justify-center">
          <svg
            class="h-5 w-5 animate-scale-check"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      )}
    </button>
  );
}
