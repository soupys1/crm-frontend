'use client'

import { useState } from 'react'
import { Mail, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export default function SettingsPage() {
  const [connecting, setConnecting] = useState(false)

  function connectGmail() {
    setConnecting(true)
    // The backend /auth/gmail/connect redirects to Google's consent screen.
    // We open it in the same tab so the OAuth callback can redirect back.
    window.location.href = `${API_BASE}/auth/gmail/connect`
  }

  const connected = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('gmail') === 'connected'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Integration
          </CardTitle>
          <CardDescription>
            Connect your Gmail account to send emails directly from the CRM and see email thread history on leads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connected ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2.5">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              Gmail connected successfully
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You&apos;ll be redirected to Google to authorize access to send emails and read threads.
              </p>
              <Button onClick={connectGmail} disabled={connecting} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                {connecting ? 'Redirecting…' : 'Connect Gmail'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
