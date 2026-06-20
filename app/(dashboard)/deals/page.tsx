'use client'

import { useEffect, useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { Plus, GripVertical } from 'lucide-react'
import { api } from '@/lib/api'
import type { Deal, DealStage, Lead } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const STAGES: { id: DealStage; label: string; accent: string }[] = [
  { id: 'prospect',       label: 'Prospect',       accent: 'var(--ink-300)' },
  { id: 'contacted',      label: 'Contacted',      accent: 'var(--cold-500)' },
  { id: 'meeting_booked', label: 'Meeting booked', accent: 'var(--ai-500)' },
  { id: 'closed_won',     label: 'Closed won',     accent: 'var(--won-500)' },
  { id: 'closed_lost',    label: 'Closed lost',    accent: 'var(--hot-500)' },
]

function money(v?: number | null) {
  if (!v) return null
  return '$' + v.toLocaleString()
}

function DraggableDealCard({ deal, isOverlay }: { deal: Deal; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'white',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 11,
        boxShadow: 'var(--shadow-xs)',
        opacity: isDragging && !isOverlay ? 0.3 : 1,
        userSelect: 'none',
        transition: 'transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
      }}
      {...attributes}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
      }}
    >
      <div className="flex items-start gap-2">
        <div {...listeners} className="mt-0.5 cursor-grab" style={{ color: 'var(--text-subtle)' }}>
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-strong)' }}>{deal.leads?.name ?? ''}</p>
          <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{deal.leads?.company ?? ''}</p>
          {deal.value != null && (
            <p className="pulse-data text-[13px] font-semibold mt-1" style={{ color: 'var(--won-600)' }}>
              {money(deal.value)}
            </p>
          )}
          {deal.next_action && (
            <p className="text-[11px] mt-1 truncate italic" style={{ color: 'var(--text-muted)' }}>{deal.next_action}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function DroppableColumn({ stage, deals }: { stage: (typeof STAGES)[number]; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const colTotal = deals.reduce((s, d) => s + (d.value ?? 0), 0)

  return (
    <div ref={setNodeRef} className="flex-1" style={{ minWidth: 180, maxWidth: 230 }}>
      <div
        className="rounded-lg min-h-[380px]"
        style={{
          background: isOver ? 'var(--ink-50)' : 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderTop: `3px solid ${stage.accent}`,
          boxShadow: 'var(--shadow-xs)',
          transition: 'background var(--dur-fast)',
        }}
      >
        {/* Column header */}
        <div className="flex items-center justify-between px-3 py-2.5 pb-3">
          <span className="pulse-eyebrow" style={{ color: 'var(--text-body)' }}>{stage.label}</span>
          <span
            className="inline-flex items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: 'var(--ink-100)', color: 'var(--text-muted)', minWidth: 20, height: 20, padding: '0 6px' }}
          >
            {deals.length}
          </span>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-2 px-2 pb-2">
          {deals.map((deal) => (
            <DraggableDealCard key={deal.id} deal={deal} />
          ))}
          {deals.length === 0 && (
            <div className="text-[12px] text-center py-4" style={{ color: 'var(--text-subtle)' }}>Empty</div>
          )}
        </div>

        {/* Column total */}
        {colTotal > 0 && (
          <div className="pulse-data text-[11px] text-right px-3 pb-2.5" style={{ color: 'var(--text-subtle)' }}>
            {money(colTotal)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [form, setForm] = useState({ lead_id: '', value: '', next_action: '' })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    Promise.all([api.deals.list(), api.leads.list()]).then(([dealsRes, leadsRes]) => {
      if (dealsRes.data) setDeals(dealsRes.data)
      if (leadsRes.data) setLeads(leadsRes.data)
      setLoading(false)
    })
  }, [])

  function handleDragStart(event: DragStartEvent) { setActiveId(event.active.id as string) }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const dealId = active.id as string
    const newStage = over.id as DealStage
    const deal = deals.find((d) => d.id === dealId)
    if (!deal || deal.stage === newStage) return
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)))
    await api.deals.update(dealId, { stage: newStage })
  }

  async function handleAddDeal(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    setAddLoading(true)
    const res = await api.deals.create({
      lead_id: form.lead_id,
      value: form.value ? Number(form.value) : undefined,
      next_action: form.next_action || undefined,
    })
    setAddLoading(false)
    if (res.error || !res.data) { setAddError(typeof res.error === 'string' ? res.error : 'Failed to create deal'); return }
    const lead = leads.find((l) => l.id === res.data!.lead_id)
    const dealWithLead: Deal = {
      ...res.data,
      leads: lead ? { name: lead.name, company: lead.company, role: lead.role, email: lead.email, score: lead.score } : undefined,
    }
    setDeals((prev) => [...prev, dealWithLead])
    setShowAdd(false)
    setForm({ lead_id: '', value: '', next_action: '' })
  }

  const openTotal = deals.filter((d) => !d.stage.startsWith('closed')).reduce((s, d) => s + (d.value ?? 0), 0)
  const activeDeal = deals.find((d) => d.id === activeId)

  if (loading) {
    return (
      <div className="p-7">
        <div className="h-8 w-32 rounded-md animate-pulse mb-6" style={{ background: 'var(--ink-100)' }} />
        <div className="flex gap-3">
          {STAGES.map((s) => (
            <div key={s.id} className="flex-1 h-64 rounded-lg animate-pulse" style={{ background: 'var(--ink-100)' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-7">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1>Deals</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {deals.length} in pipeline
            {openTotal > 0 && (
              <> · <span className="pulse-data font-semibold" style={{ color: 'var(--won-600)' }}>{money(openTotal)}</span> open value</>
            )}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add deal
        </Button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage) => (
            <DroppableColumn key={stage.id} stage={stage} deals={deals.filter((d) => d.stage === stage.id)} />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? <DraggableDealCard deal={activeDeal} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDeal} className="space-y-4 mt-2">
            {addError && (
              <p className="text-sm px-3 py-2 rounded-md" style={{ color: 'var(--hot-600)', background: 'var(--hot-50)' }}>{addError}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="deal-lead">Lead *</Label>
              <select
                id="deal-lead"
                value={form.lead_id}
                onChange={(e) => setForm((f) => ({ ...f, lead_id: e.target.value }))}
                required
                className="flex h-10 w-full rounded-md px-3 py-2 text-sm"
                style={{ border: '1px solid var(--border-field)', background: 'white', color: 'var(--text-strong)', outline: 'none' }}
              >
                <option value="">Select a lead…</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}{l.company ? ` (${l.company})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-value">Deal value ($)</Label>
              <Input id="deal-value" type="number" min="0" step="any" placeholder="e.g. 5000" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-action">Next action</Label>
              <Input id="deal-action" placeholder="e.g. Schedule demo call" value={form.next_action} onChange={(e) => setForm((f) => ({ ...f, next_action: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={addLoading}>{addLoading ? 'Adding…' : 'Add deal'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
