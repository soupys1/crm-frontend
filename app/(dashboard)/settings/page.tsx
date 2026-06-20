'use client'

import { useState } from 'react'
import { Mail, ExternalLink, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export default function SettingsPage() {
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connected =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('gmail') === 'connected'

  async function connectGmail() {
    setConnecting(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Not signed in. Please log in and try again.')
        setConnecting(false)
        return
      }

      window.location.href = `${API_BASE}/auth/gmail/connect?token=${session.access_token}`
    } catch {
      setError('Something went wrong. Please try again.')
      setConnecting(false)
    }
  }

  return (
    <div className="p-7" style={{ maxWidth: 680, margin: '0 auto' }}>
      <h1 className="mb-6">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-[17px] w-[17px]" style={{ color: 'var(--pulse-500)' }} />
            Gmail integration
          </CardTitle>
          <CardDescription>
            Connect your Gmail to send emails directly from Pulse and see thread history on leads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connected ? (
            <div
              className="flex items-center gap-2 text-sm rounded-md px-3 py-2.5"
              style={{ color: 'var(--won-600)', background: 'var(--won-50)', border: '1px solid #bbf0d8' }}
            >
              <Check className="h-4 w-4 shrink-0" />
              Gmail connected successfully
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <p className="text-sm px-3 py-2 rounded-md" style={{ color: 'var(--hot-600)', background: 'var(--hot-50)' }}>
                  {error}
                </p>
              )}
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                You will be redirected to Google to authorize access to send emails and read threads.
              </p>
              <Button onClick={connectGmail} disabled={connecting} variant="outline">
                <ExternalLink className="h-4 w-4" />
                {connecting ? 'Redirecting…' : 'Connect Gmail'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
