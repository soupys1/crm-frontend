import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-semibold transition-all focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:     'bg-[--pulse-500] text-white hover:bg-[--pulse-600] hover:-translate-y-px hover:shadow-[var(--glow-primary)] active:translate-y-px',
        destructive: 'bg-[--hot-500] text-white hover:bg-[--hot-600] hover:-translate-y-px hover:shadow-[var(--glow-hot)] active:translate-y-px',
        outline:     'border border-[--border-field] bg-white text-[--text-strong] hover:bg-[--ink-50] hover:-translate-y-px active:translate-y-px',
        secondary:   'bg-[--ink-100] text-[--text-strong] border border-[--border-subtle] hover:bg-[--ink-150] hover:-translate-y-px active:translate-y-px',
        ghost:       'text-[--text-body] hover:bg-[--ink-100]',
        ai:          'bg-[--ai-500] text-white hover:bg-[--ai-600] hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(139,92,246,.38)] active:translate-y-px',
        link:        'text-[--text-link] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 rounded-md text-sm gap-2',
        sm:      'h-8 px-3 rounded-sm text-[13px] gap-1.5',
        lg:      'h-12 px-6 rounded-md text-[15px] gap-2',
        icon:    'h-10 w-10 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      style={{ transitionDuration: 'var(--dur-fast)', transitionTimingFunction: 'var(--ease-out)' }}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
