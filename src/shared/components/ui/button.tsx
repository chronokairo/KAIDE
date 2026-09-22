"use client";

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
    const variants = {
      default: 'bg-primary text-on-primary hover:bg-primary/90 shadow-2xs',
      outline: 'border border-outline-variant/60 bg-transparent text-primary hover:bg-surface-container',
      ghost: 'bg-transparent text-primary hover:bg-surface-container',
      secondary: 'bg-surface-container text-primary hover:bg-surface-container-high',
      danger: 'bg-error text-on-error hover:bg-error/90',
    };
    const sizes = {
      sm: 'px-2.5 py-1 text-xs',
      md: 'px-3.5 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
      icon: 'p-2 w-8 h-8',
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
