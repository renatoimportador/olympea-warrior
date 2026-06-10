import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-gradient-to-r from-accent to-accent-secondary text-bg-primary shadow-[0_4px_16px_rgba(0,229,255,0.2)] hover:shadow-[0_6px_24px_rgba(0,229,255,0.35)] hover:-translate-y-0.5',
    secondary: 'bg-white/[0.06] text-text-primary border border-white/[0.08] hover:bg-white/[0.1] hover:border-accent/20',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]',
    danger: 'bg-error/10 text-error border border-error/20 hover:bg-error/20',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}
