'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import type { Lead, LeadScore } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const SCORE_CONFIG: Record<LeadScore, { label: string; glyph: string; bg: string; fg: string }> = {
  hot:  { label: 'Hot',  glyph: '🔥', bg: 'var(--hot-50)',  fg: 'var(--hot-600)' },
  warm: { label: 'Warm', glyph: '🌤', bg: 'var(--warm-50)', fg: 'var(--warm-600)' },
  cold: { label: 'Cold', glyph: '❄️', bg: 'var(--cold-50)', fg: '#0a7ea4' },
}

function ScoreBadge({ score }: { score: LeadScore }) {
  const c = SCORE_CONFIG[score]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full text-[12px] font-semibold leading-none"
      style={{ background: c.bg, color: c.fg, height: 22, padding: '0 10px 0 8px' }}
    >
      <span style={{ fontSize: 11 }}>{c.glyph}</span>
      {c.label}
    </span>
  )
}

const FILTERS: Array<LeadScore | 'all'> = ['all', 'hot', 'warm', 'cold']

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [scoreFilter, setScoreFilter] = useState<LeadScore | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', company: '', role: '', email: '', linkedin_url: '' })

  useEffect(() => {
    api.leads.list().then((res) => {
      if (res.data) setLeads(res.data)
      setLoading(false)
    })
  }, [])

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch = !q || l.name.toLowerCase().includes(q) || (l.company ?? '').toLowerCase().includes(q)
    const matchScore = scoreFilter === 'all' || l.score === scoreFilter
    return matchSearch && matchScore
  })

  const hotCount = leads.filter((l) => l.score === 'hot').length

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    setAddLoading(true)
    const res = await api.leads.create(form)
    setAddLoading(false)
    if (res.error) { setAddError(typeof res.error === 'string' ? res.error : 'Validation error'); return }
    if (!res.data) return
    setLeads((prev) => [res.data!, ...prev])
    setShowAdd(false)
    setForm({ name: '', company: '', role: '', email: '', linkedin_url: '' })
  }

  return (
    <div className="p-7" style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
      {/* Page header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1>Leads</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {leads.length} total{hotCount > 0 ? ` · ${hotCount} hot` : ''}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add lead
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-5 items-center">
        <div className="relative flex-1 max-w-[340px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[15px] w-[15px]" style={{ color: 'var(--text-subtle)' }} />
          <Input
            placeholder="Search by name or company…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setScoreFilter(f)}
              className="px-3.5 rounded-md text-[13px] font-semibold capitalize transition-colors"
              style={{
                height: 36,
                background: scoreFilter === f ? 'var(--ink-800)' : 'var(--ink-100)',
                color: scoreFilter === f ? '#fff' : 'var(--text-body)',
                border: 'none',
                cursor: 'pointer',
                transitionDuration: 'var(--dur-fast)',
              }}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[72px] rounded-lg animate-pulse" style={{ background: 'var(--ink-100)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          {search || scoreFilter !== 'all' ? 'No leads match your filter.' : 'No leads yet. Add your first one!'}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              onClick={() => router.push(`/leads/${lead.id}`)}
              className="group flex items-center gap-3.5 rounded-lg bg-white cursor-pointer transition-[box-shadow,transform] px-5 py-3.5"
              style={{
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                transitionDuration: 'var(--dur-base)',
                transitionTimingFunction: 'var(--ease-out)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
              }}
            >
              {/* Avatar */}
              <span
                className="inline-flex items-center justify-center rounded-full flex-shrink-0 font-semibold text-sm text-white"
                style={{ width: 40, height: 40, background: 'var(--pulse-500)' }}
              >
                {lead.name.charAt(0).toUpperCase()}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate" style={{ color: 'var(--text-strong)', fontSize: 15 }}>{lead.name}</span>
                  {lead.score && <ScoreBadge score={lead.score} />}
                </div>
                <p className="text-[13px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                  {[lead.role, lead.company].filter(Boolean).join(' · ')}
                </p>
              </div>

              <div className="text-right mr-1.5 flex-shrink-0">
                {lead.email && (
                  <p className="pulse-data text-[12px]" style={{ color: 'var(--text-subtle)' }}>{lead.email}</p>
                )}
              </div>

              <ChevronRight className="h-[18px] w-[18px] flex-shrink-0" style={{ color: 'var(--text-subtle)' }} />
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            {addError && (
              <p className="text-sm px-3 py-2 rounded-md" style={{ color: 'var(--hot-600)', background: 'var(--hot-50)' }}>{addError}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-name">Name *</Label>
                <Input id="add-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-company">Company</Label>
                <Input id="add-company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-role">Role</Label>
                <Input id="add-role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-linkedin">LinkedIn URL</Label>
              <Input id="add-linkedin" type="url" placeholder="https://linkedin.com/in/…" value={form.linkedin_url} onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))} />
            </div>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Filling name, company &amp; role enables AI enrichment on save.
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={addLoading}>{addLoading ? 'Saving…' : 'Add lead'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
