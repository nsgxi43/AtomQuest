import React, { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full px-4 py-2.5 border rounded-lg text-base text-gray-900 font-medium placeholder:text-gray-500 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300 hover:border-gray-400",
            className
          )}
          {...props}
        />
        {error && <p className="text-red-600 text-sm mt-1.5 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-gray-500 text-sm mt-1.5">{helperText}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
