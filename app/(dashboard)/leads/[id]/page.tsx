'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Sparkles, Send, Check, Inbox } from 'lucide-react'
import { api } from '@/lib/api'
import type { Lead, EmailThread, DraftResult, LeadScore } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

const SCORE_CONFIG: Record<LeadScore, { label: string; glyph: string; bg: string; fg: string; solidBg: string }> = {
  hot:  { label: 'Hot',  glyph: '🔥', bg: 'var(--hot-50)',  fg: 'var(--hot-600)',  solidBg: 'var(--hot-500)' },
  warm: { label: 'Warm', glyph: '🌤', bg: 'var(--warm-50)', fg: 'var(--warm-600)', solidBg: 'var(--warm-500)' },
  cold: { label: 'Cold', glyph: '❄️', bg: 'var(--cold-50)', fg: '#0a7ea4',          solidBg: 'var(--cold-500)' },
}

function ScoreBadge({ score, solid }: { score: LeadScore; solid?: boolean }) {
  const c = SCORE_CONFIG[score]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full text-[12px] font-semibold leading-none"
      style={{
        background: solid ? c.solidBg : c.bg,
        color: solid ? '#fff' : c.fg,
        height: 22,
        padding: '0 10px 0 8px',
      }}
    >
      <span style={{ fontSize: 11 }}>{c.glyph}</span>
      {c.label}
    </span>
  )
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
    api.leads.get(id).then((leadRes) => {
      if (leadRes.data) {
        setLead(leadRes.data)
        if (leadRes.data.email) {
          api.email.threads(leadRes.data.email).then((t) => { if (t.data) setThreads(t.data) })
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
    if (res.data) setLead((prev) => prev ? { ...prev, score: res.data.score, ai_summary: res.data.summary } : prev)
  }

  async function handleDraftSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lead) return
    setDraftError(null)
    setDraftLoading(true)
    const res = await api.ai.draft({ lead_id: lead.id, intent, pitch })
    setDraftLoading(false)
    if (res.error) { setDraftError(typeof res.error === 'string' ? res.error : 'Failed to draft email'); return }
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
    if (res.error) { setSendError(typeof res.error === 'string' ? res.error : 'Failed to send email'); return }
    setSendSuccess(true)
    setTimeout(() => {
      setDraftOpen(false); setSendSuccess(false); setSendError(null); setDraftStep('form'); setPitch('')
    }, 1500)
  }

  if (loading) {
    return (
      <div className="p-7 max-w-3xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg animate-pulse" style={{ background: 'var(--ink-100)' }} />
        ))}
      </div>
    )
  }

  if (!lead) {
    return <div className="p-7 text-center" style={{ color: 'var(--text-muted)' }}>Lead not found.</div>
  }

  return (
    <div className="p-7 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push('/leads')}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-5 transition-colors"
        style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-body)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <span
          className="inline-flex items-center justify-center rounded-full flex-shrink-0 font-semibold text-lg text-white"
          style={{ width: 56, height: 56, background: 'var(--pulse-500)' }}
        >
          {lead.name.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 style={{ fontSize: 26 }}>{lead.name}</h1>
            {lead.score && <ScoreBadge score={lead.score} solid />}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {[lead.role, lead.company].filter(Boolean).join(' @ ')}
          </p>
          {lead.email && (
            <p className="pulse-data text-[13px] mt-0.5" style={{ color: 'var(--text-body)' }}>{lead.email}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleEnrich} disabled={enriching}>
            <Sparkles className="h-3.5 w-3.5" />
            {enriching ? 'Enriching…' : 'Re-enrich'}
          </Button>
          {lead.email && (
            <Button variant="ai" size="sm" onClick={() => { setDraftOpen(true); setDraftStep('form') }}>
              <Mail className="h-3.5 w-3.5" />
              Draft email
            </Button>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {lead.ai_summary ? (
        <div
          className="rounded-lg bg-white mb-3.5 overflow-hidden"
          style={{ border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
        >
          {/* violet accent bar */}
          <div style={{ height: 3, background: 'var(--ai-500)' }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-[17px] w-[17px]" style={{ color: 'var(--ai-500)' }} />
              <span className="font-semibold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-strong)' }}>AI Summary</span>
              <span
                className="inline-flex items-center rounded-full text-[11px] font-semibold leading-none ml-1"
                style={{ background: 'var(--ai-50)', color: 'var(--ai-600)', height: 20, padding: '0 8px' }}
              >
                generated
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>{lead.ai_summary}</p>
          </div>
        </div>
      ) : (
        <div
          className="rounded-lg bg-white mb-3.5 p-5 text-center"
          style={{ border: '1px dashed var(--border-strong)' }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            Add company and role to generate an AI enrichment.
          </p>
          <Button variant="outline" size="sm" onClick={handleEnrich} disabled={enriching}>
            <Sparkles className="h-3.5 w-3.5" />
            {enriching ? 'Enriching…' : 'Enrich now'}
          </Button>
        </div>
      )}

      {/* Email Threads */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="h-[17px] w-[17px]" style={{ color: 'var(--pulse-500)' }} />
            Email threads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!lead.email ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No email on file.</p>
          ) : threads.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No threads found in Gmail.</p>
          ) : (
            <div className="space-y-2.5">
              {threads.map((t) => (
                <div
                  key={t.id}
                  className="rounded-md px-3.5 py-3"
                  style={{ border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-strong)' }}>{t.subject}</span>
                    <span className="pulse-data text-[12px]" style={{ color: 'var(--text-subtle)' }}>
                      {new Date(t.last_message_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[13px] mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{t.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Draft dialog */}
      <Dialog open={draftOpen} onClose={() => { setDraftOpen(false); setDraftStep('form') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draftStep === 'form' ? 'Draft email' : 'Review & send'}</DialogTitle>
          </DialogHeader>

          {draftStep === 'form' ? (
            <form onSubmit={handleDraftSubmit} className="space-y-4 mt-2">
              {draftError && (
                <p className="text-sm px-3 py-2 rounded-md" style={{ color: 'var(--hot-600)', background: 'var(--hot-50)' }}>{draftError}</p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="intent">Email type</Label>
                <select
                  id="intent"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value as typeof intent)}
                  className="flex h-10 w-full rounded-md px-3 py-2 text-sm"
                  style={{ border: '1px solid var(--border-field)', background: 'white', color: 'var(--text-strong)', outline: 'none' }}
                >
                  <option value="cold">Cold outreach</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="breakup">Break-up email</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pitch">Your pitch / context</Label>
                <Textarea id="pitch" placeholder="What's the value prop? Why are you reaching out?" value={pitch} onChange={(e) => setPitch(e.target.value)} rows={4} required minLength={10} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDraftOpen(false)}>Cancel</Button>
                <Button variant="ai" type="submit" disabled={draftLoading}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {draftLoading ? 'Drafting…' : 'Generate draft'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 mt-2">
              {sendSuccess && (
                <p className="text-sm px-3 py-2 rounded-md flex items-center gap-2" style={{ color: 'var(--won-600)', background: 'var(--won-50)' }}>
                  <Check className="h-4 w-4" /> Email sent!
                </p>
              )}
              {sendError && (
                <div className="text-sm px-3 py-2 rounded-md" style={{ color: 'var(--hot-600)', background: 'var(--hot-50)' }}>
                  {sendError.includes('Gmail not connected') ? (
                    <>Gmail not connected. <a href="/settings" className="font-semibold underline">Go to Settings</a> to connect your Gmail.</>
                  ) : sendError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="draft-subject">Subject</Label>
                <Input id="draft-subject" value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="draft-body">Body</Label>
                <Textarea id="draft-body" rows={8} value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDraftStep('form')}>Back</Button>
                <Button onClick={handleSend} disabled={sendLoading || sendSuccess}>
                  <Send className="h-3.5 w-3.5" />
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
