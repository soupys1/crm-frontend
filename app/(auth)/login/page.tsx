'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center rounded-[9px]"
        style={{ width: 32, height: 32, background: 'var(--pulse-500)', boxShadow: 'var(--glow-primary)' }}
      >
        <Zap className="h-4 w-4 fill-white text-white" />
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-strong)' }}>
        Pulse
      </span>
    </span>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/leads')
    router.refresh()
  }

  return (
    <>
      {/* Left - form */}
      <div className="flex flex-1 items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[320px]">
          <Logo />
          <h1 className="mt-7 mb-1.5" style={{ fontSize: 28 }}>Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Sign in to your pipeline.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {error && (
              <p className="text-sm px-3 py-2 rounded-md" style={{ color: 'var(--hot-600)', background: 'var(--hot-50)' }}>{error}</p>
            )}
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-strong)' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-subtle)' }} />
                <Input type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: 'var(--text-strong)' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-subtle)' }} />
                <Input type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full mt-1.5" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-[13px] text-center mt-5" style={{ color: 'var(--text-muted)' }}>
            No account?{' '}
            <Link href="/signup" className="font-semibold" style={{ color: 'var(--text-link)' }}>Start free</Link>
          </p>
        </div>
      </div>

      {/* Right - brand panel */}
      <div
        className="hidden md:flex flex-1 flex-col justify-center p-12 relative overflow-hidden"
        style={{ background: 'var(--pulse-500)', color: '#fff' }}
      >
        <div className="absolute rounded-full" style={{ top: -80, right: -60, width: 280, height: 280, background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute rounded-full" style={{ bottom: -100, left: -40, width: 240, height: 240, background: 'rgba(255,255,255,0.06)' }} />

        <span className="pulse-eyebrow" style={{ color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em' }}>AI CRM</span>
        <h2 className="mt-3.5 max-w-[360px]" style={{ color: '#fff', fontSize: 36, lineHeight: 1.1 }}>
          The pipeline that moves itself.
        </h2>
        <p className="mt-4 max-w-[340px]" style={{ color: 'rgba(255,255,255,0.86)', fontSize: 15, lineHeight: 1.6 }}>
          Enrich every lead, draft every email, and watch deals advance. Pulse does the busywork so you close.
        </p>

        <div className="flex gap-6 mt-9">
          {([['4s', 'avg enrich'], ['41%', 'reply rate'], ['2.3×', 'more meetings']] as const).map(([n, l]) => (
            <div key={l}>
              <div className="pulse-data" style={{ fontSize: 26, fontWeight: 600, color: '#fff' }}>{n}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
