"use client";

import React, { InputHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            className={cn(
              "w-full px-4 py-2.5 border rounded-lg text-base text-gray-900 font-medium placeholder:text-gray-500 disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-gray-300 hover:border-gray-400",
              isPassword && "pr-10",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
        {error && <p className="text-red-600 text-sm mt-1.5 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-gray-500 text-sm mt-1.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
