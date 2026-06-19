'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Sparkles, Send } from 'lucide-react'
import { api } from '@/lib/api'
import type { Lead, EmailThread, DraftResult } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const SCORE_COLORS = {
  hot: 'bg-red-100 text-red-700 border-red-200',
  warm: 'bg-amber-100 text-amber-700 border-amber-200',
  cold: 'bg-blue-100 text-blue-700 border-blue-200',
}

type DraftStep = 'form' | 'edit'

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [lead, setLead] = useState<Lead | null>(null)
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)

  const [draftOpen, setDraftOpen] = useState(false)
  const [draftStep, setDraftStep] = useState<DraftStep>('form')
  const [intent, setIntent] = useState<'cold' | 'follow_up' | 'breakup'>('cold')
  const [pitch, setPitch] = useState('')
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftResult>({ subject: '', body: '' })
  const [sendLoading, setSendLoading] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.leads.get(id),
    ]).then(([leadRes]) => {
      if (leadRes.data) {
        setLead(leadRes.data)
        if (leadRes.data.email) {
          api.email.threads(leadRes.data.email).then((t) => {
            if (t.data) setThreads(t.data)
          })
        }
      }
      setLoading(false)
    })
  }, [id])

  async function handleEnrich() {
    if (!lead) return
    setEnriching(true)
    const res = await api.ai.enrich(lead.id)
    setEnriching(false)
    if (res.data) {
      setLead((prev) => prev ? { ...prev, score: res.data.score, ai_summary: res.data.summary } : prev)
    }
  }

  async function handleDraftSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lead) return
    setDraftError(null)
    setDraftLoading(true)
    const res = await api.ai.draft({ lead_id: lead.id, intent, pitch })
    setDraftLoading(false)
    if (res.error) {
      setDraftError(typeof res.error === 'string' ? res.error : 'Failed to draft email')
      return
    }
    if (!res.data) return
    setDraft(res.data)
    setDraftStep('edit')
  }

  async function handleSend() {
    if (!lead?.email) return
    setSendError(null)
    setSendLoading(true)
    const res = await api.email.send({ to: lead.email, subject: draft.subject, body: draft.body })
    setSendLoading(false)
    if (res.error) {
      const msg = typeof res.error === 'string' ? res.error : 'Failed to send email'
      setSendError(msg)
      return
    }
    setSendSuccess(true)
    setTimeout(() => {
      setDraftOpen(false)
      setSendSuccess(false)
      setSendError(null)
      setDraftStep('form')
      setPitch('')
    }, 1500)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-6 text-center text-muted-foreground">Lead not found.</div>
    )
  }

  const summaryLines = lead.ai_summary ? lead.ai_summary.split('\n').filter(Boolean) : []

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/leads')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            {lead.score && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${SCORE_COLORS[lead.score]}`}
              >
                {lead.score}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5">
            {[lead.role, lead.company].filter(Boolean).join(' @ ')}
          </p>
          {lead.email && <p className="text-sm mt-0.5">{lead.email}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEnrich} disabled={enriching}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {enriching ? 'Enriching…' : 'Re-enrich'}
          </Button>
          {lead.email && (
            <Button size="sm" onClick={() => { setDraftOpen(true); setDraftStep('form') }}>
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Draft Email
            </Button>
          )}
        </div>
      </div>

      {lead.ai_summary && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{lead.ai_summary}</p>
          </CardContent>
        </Card>
      )}

      {!lead.ai_summary && (
        <Card className="mb-4 border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Add company and role to generate an AI enrichment.
            </p>
            <Button variant="outline" size="sm" onClick={handleEnrich} disabled={enriching}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {enriching ? 'Enriching…' : 'Enrich now'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Email Threads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!lead.email ? (
            <p className="text-sm text-muted-foreground">No email on file.</p>
          ) : threads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No threads found in Gmail.</p>
          ) : (
            <div className="space-y-3">
              {threads.map((t) => (
                <div key={t.id} className="border rounded-md px-3 py-2.5">
                  <p className="text-sm font-medium">{t.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.snippet}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(t.last_message_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={draftOpen} onClose={() => { setDraftOpen(false); setDraftStep('form') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {draftStep === 'form' ? 'Draft Email' : 'Review & Send'}
            </DialogTitle>
          </DialogHeader>

          {draftStep === 'form' ? (
            <form onSubmit={handleDraftSubmit} className="space-y-4 mt-2">
              {draftError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{draftError}</p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="intent">Email type</Label>
                <select
                  id="intent"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value as typeof intent)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="cold">Cold outreach</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="breakup">Break-up email</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pitch">Your pitch / context</Label>
                <Textarea
                  id="pitch"
                  placeholder="What's the value prop? Why are you reaching out?"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  rows={4}
                  required
                  minLength={10}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDraftOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={draftLoading}>
                  {draftLoading ? 'Drafting…' : 'Generate Draft'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 mt-2">
              {sendSuccess && (
                <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">Email sent!</p>
              )}
              {sendError && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {sendError.includes('Gmail not connected') ? (
                    <>
                      Gmail is not connected.{' '}
                      <a href="/settings" className="underline font-medium">
                        Go to Settings
                      </a>{' '}
                      to connect your Gmail account.
                    </>
                  ) : sendError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="draft-subject">Subject</Label>
                <input
                  id="draft-subject"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={draft.subject}
                  onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="draft-body">Body</Label>
                <Textarea
                  id="draft-body"
                  rows={8}
                  value={draft.body}
                  onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDraftStep('form')}>
                  Back
                </Button>
                <Button onClick={handleSend} disabled={sendLoading || sendSuccess}>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {sendLoading ? 'Sending…' : 'Send'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
