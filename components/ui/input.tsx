import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-10 w-full rounded-md border border-[--border-field] bg-white px-3 py-2 text-sm text-[--text-strong] placeholder:text-[--text-subtle]',
      'focus-visible:outline-none focus-visible:border-[--pulse-500] focus-visible:shadow-[var(--focus-ring)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-[border-color,box-shadow]',
      className
    )}
    style={{ transitionDuration: 'var(--dur-fast)', transitionTimingFunction: 'var(--ease-out)' }}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
