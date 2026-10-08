"use client";

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={`w-full px-3 py-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-low text-primary text-xs focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50 transition-colors ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
