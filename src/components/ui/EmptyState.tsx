"use client";

import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCTA?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCTA,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 text-sm mb-6 max-w-md">{description}</p>
      )}
      {ctaLabel && onCTA && (
        <Button variant="primary" onClick={onCTA}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
