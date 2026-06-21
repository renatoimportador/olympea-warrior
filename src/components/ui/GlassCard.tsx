import React from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-glass transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
