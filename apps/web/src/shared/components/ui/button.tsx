"use client";

// Vendirado de @chronokairo/platform/ui (removido como dependência — ver ADR-0042
// e commit de remoção do platform). Cópia fiel do Button do platform para manter
// o ponto de import local estável: `@/shared/components/ui/button`.
import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}) => {
  const getStyles = () => {
    switch (variant) {
      case "secondary":
        return "bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--on-surface)] border border-[var(--outline)]";
      case "outline":
        return "border border-[var(--outline)] hover:bg-[var(--surface-container)] text-[var(--on-surface)]";
      case "ghost":
        return "hover:bg-[var(--surface-container)] text-[var(--on-surface)]";
      case "danger":
        return "bg-rose-600 hover:bg-rose-700 text-white";
      default:
        return "bg-[var(--primary)] hover:opacity-90 text-[var(--on-primary)] shadow-xs";
    }
  };

  const getSizes = () => {
    switch (size) {
      case "sm": return "px-2.5 py-1 text-xs";
      case "lg": return "px-5 py-2.5 text-base";
      default: return "px-4 py-2 text-sm";
    }
  };

  return (
    <button
      className={`rounded-xl font-medium transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${getStyles()} ${getSizes()} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
