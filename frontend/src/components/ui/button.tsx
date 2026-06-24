import { type ButtonHTMLAttributes } from "react";

type Variant = "default" | "destructive" | "ghost" | "outline";

const variants: Record<Variant, string> = {
  default: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100",
  destructive: "bg-red-900 hover:bg-red-800 text-red-100",
  ghost: "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200",
  outline: "border border-zinc-700 hover:bg-zinc-800 text-zinc-300",
};

export function Button({
  variant = "default",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
