import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

const styles = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent-hover",
        secondary: "border border-line bg-canvas text-ink hover:bg-soft",
        ghost: "text-ink hover:bg-soft",
        danger: "text-danger hover:bg-soft",
      },
      size: {
        sm: "h-7 px-2 text-xs",
        md: "h-8 px-2.5 text-[13px]",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof styles>) {
  return <button className={cn(styles({ variant, size }), className)} {...props} />;
}
