'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { api } from '@/lib/api'
import type { Lead, LeadScore } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const SCORE_COLORS: Record<LeadScore, string> = {
  hot: 'bg-red-100 text-red-700 border-red-200',
  warm: 'bg-amber-100 text-amber-700 border-amber-200',
  cold: 'bg-blue-100 text-blue-700 border-blue-200',
}

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
    const matchSearch =
      !q || l.name.toLowerCase().includes(q) || (l.company ?? '').toLowerCase().includes(q)
    const matchScore = scoreFilter === 'all' || l.score === scoreFilter
    return matchSearch && matchScore
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    setAddLoading(true)
    const res = await api.leads.create(form)
    setAddLoading(false)
    if (res.error) {
      setAddError(typeof res.error === 'string' ? res.error : 'Validation error')
      return
    }
    if (!res.data) return
    setLeads((prev) => [res.data!, ...prev])
    setShowAdd(false)
    setForm({ name: '', company: '', role: '', email: '', linkedin_url: '' })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{leads.length} total</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or company…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'hot', 'warm', 'cold'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScoreFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                scoreFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {search || scoreFilter !== 'all' ? 'No leads match your filter.' : 'No leads yet. Add your first one!'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <Card
              key={lead.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/leads/${lead.id}`)}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{lead.name}</span>
                    {lead.score && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SCORE_COLORS[lead.score]}`}
                      >
                        {lead.score}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {[lead.role, lead.company].filter(Boolean).join(' @ ')}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground shrink-0">{lead.email}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            {addError && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{addError}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-name">Name *</Label>
                <Input
                  id="add-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-company">Company</Label>
                <Input
                  id="add-company"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-role">Role</Label>
                <Input
                  id="add-role"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-linkedin">LinkedIn URL</Label>
              <Input
                id="add-linkedin"
                type="url"
                placeholder="https://linkedin.com/in/…"
                value={form.linkedin_url}
                onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Filling name, company, and role enables AI enrichment on save.
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addLoading}>
                {addLoading ? 'Saving…' : 'Add Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
