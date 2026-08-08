import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ControlSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ControlSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: ControlSize;
  invalid?: boolean;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--color-blueprint)] text-white hover:bg-[color:var(--color-blueprint-strong)] focus-visible:ring-[color:var(--color-blueprint)]",
  secondary:
    "border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper-raised)] text-body hover:bg-[color:var(--color-paper-sunken)] focus-visible:ring-[color:var(--color-blueprint)] dark:border-strong dark:bg-inverse dark:text-inverse-muted dark:hover:bg-inverse/50",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  ghost:
    "text-body hover:bg-[color:var(--color-paper-sunken)] focus-visible:ring-[color:var(--color-blueprint)] dark:text-inverse-muted dark:hover:bg-inverse",
};

const controlSizes: Record<ControlSize, string> = {
  sm: "px-2.5 py-1 text-ui-11",
  md: "px-3 py-1.5 text-ui-13",
};

const inputBase =
  "block w-full rounded border bg-[color:var(--color-paper-raised)] text-heading placeholder:text-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-blueprint)] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[color:var(--color-paper-sunken)] dark:bg-inverse dark:text-foreground dark:placeholder:text-muted dark:focus-visible:ring-offset-background dark:disabled:bg-inverse";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", leftIcon, rightIcon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(buttonBase, buttonVariants[variant], controlSizes[size], className)}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = "md", invalid = false, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(
        inputBase,
        invalid ? "border-accent focus-visible:ring-red-500" : "border-[color:var(--color-paper-line)] dark:border-strong",
        size === "sm" ? "px-2 py-1 text-ui-11" : "px-2.5 py-1.5 text-ui-13",
        className,
      )}
      {...rest}
    />
  );
});
