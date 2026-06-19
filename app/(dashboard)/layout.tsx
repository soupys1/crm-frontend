'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, LayoutDashboard, Settings, LogOut, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/leads',    label: 'Leads',    icon: Users },
  { href: '/deals',    label: 'Deals',    icon: LayoutDashboard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="inline-flex items-center justify-center flex-shrink-0 rounded-[9px]"
        style={{ width: 30, height: 30, background: 'var(--pulse-500)', boxShadow: 'var(--glow-primary)' }}
      >
        <Zap className="h-3.5 w-3.5 fill-white text-white" />
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-strong)' }}>
        Pulse
      </span>
    </span>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--surface-page)' }}>
      <aside
        className="flex flex-col flex-shrink-0 h-full bg-white"
        style={{ width: 'var(--sidebar-width)', borderRight: '1px solid var(--border-subtle)' }}
      >
        {/* Logo */}
        <div className="px-[18px] py-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <Logo />
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-[9px] rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'text-white'
                    : 'hover:bg-[--ink-100]'
                )}
                style={{
                  background: active ? 'var(--pulse-500)' : undefined,
                  color: active ? '#fff' : 'var(--text-muted)',
                  transitionDuration: 'var(--dur-fast)',
                  transitionTimingFunction: 'var(--ease-out)',
                }}
              >
                <Icon className="h-[17px] w-[17px]" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-[--ink-100]"
            style={{ color: 'var(--text-muted)', transitionDuration: 'var(--dur-fast)' }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
