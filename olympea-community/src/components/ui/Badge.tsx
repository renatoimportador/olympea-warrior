import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent'
}

export function Badge({ children, variant = 'default', className, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-white/[0.06] text-text-secondary border-white/[0.08]',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border', variants[variant], className)} {...props}>
      {children}
    </span>
  )
}
