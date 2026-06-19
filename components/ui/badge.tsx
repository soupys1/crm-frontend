import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-semibold whitespace-nowrap leading-none',
  {
    variants: {
      variant: {
        default:     'bg-[--pulse-50] text-[--pulse-700] text-[12px] px-2.5 h-6',
        secondary:   'bg-[--ink-100] text-[--ink-700] text-[12px] px-2.5 h-6',
        destructive: 'bg-[--hot-50] text-[--hot-600] text-[12px] px-2.5 h-6',
        outline:     'border border-[--border-subtle] text-[--text-body] text-[12px] px-2.5 h-6',
        ai:          'bg-[--ai-50] text-[--ai-600] text-[11px] px-2 h-5',
        won:         'bg-[--won-50] text-[--won-600] text-[12px] px-2.5 h-6',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
