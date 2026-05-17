"use client";

import React, { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, ...props }, ref) => {
    const variantStyles = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",
      secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100",
      danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400",
      ghost: "bg-transparent text-gray-900 hover:bg-gray-100",
    };

    const sizeStyles = {
      sm: "px-3 py-1 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        disabled={loading || props.disabled}
        className={cn(
          "rounded-lg font-medium flex items-center justify-center gap-2 transition-colors",
          variantStyles[variant],
          sizeStyles[size],
          props.className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {props.children}
      </button>
    );
  }
);

Button.displayName = "Button";
