'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { Plus, GripVertical } from 'lucide-react'
import { api } from '@/lib/api'
import type { Deal, DealStage, Lead } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: 'prospect', label: 'Prospect', color: 'border-t-slate-400' },
  { id: 'contacted', label: 'Contacted', color: 'border-t-blue-400' },
  { id: 'meeting_booked', label: 'Meeting Booked', color: 'border-t-violet-400' },
  { id: 'closed_won', label: 'Closed Won', color: 'border-t-green-500' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'border-t-red-400' },
]

function DraggableDealCard({ deal, isOverlay }: { deal: Deal; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg p-3 shadow-sm select-none ${isDragging && !isOverlay ? 'opacity-30' : ''}`}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <div {...listeners} className="mt-0.5 cursor-grab text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{deal.leads?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground truncate">{deal.leads?.company ?? ''}</p>
          {deal.value != null && (
            <p className="text-xs font-medium text-green-700 mt-1">
              ${deal.value.toLocaleString()}
            </p>
          )}
          {deal.next_action && (
            <p className="text-xs text-muted-foreground mt-1 italic truncate">{deal.next_action}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function DroppableColumn({ stage, deals }: { stage: (typeof STAGES)[number]; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[180px] max-w-[220px] rounded-xl border-t-4 bg-muted/40 transition-colors ${stage.color} ${isOver ? 'bg-muted/70' : ''}`}
    >
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage.label}</span>
        <span className="text-xs font-medium bg-background border rounded-full w-5 h-5 flex items-center justify-center">
          {deals.length}
        </span>
      </div>
      <div className="px-2 pb-2 space-y-2 min-h-[80px]">
        {deals.map((deal) => (
          <DraggableDealCard key={deal.id} deal={deal} />
        ))}
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

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

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
    if (res.error || !res.data) {
      setAddError(typeof res.error === 'string' ? res.error : 'Failed to create deal')
      return
    }
    const newDeal = res.data
    const lead = leads.find((l) => l.id === newDeal.lead_id)
    const dealWithLead: Deal = {
      ...newDeal,
      leads: lead ? { name: lead.name, company: lead.company, role: lead.role, email: lead.email, score: lead.score } : undefined,
    }
    setDeals((prev) => [...prev, dealWithLead])
    setShowAdd(false)
    setForm({ lead_id: '', value: '', next_action: '' })
  }

  const activeDeal = deals.find((d) => d.id === activeId)

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-32 bg-muted rounded animate-pulse mb-6" />
        <div className="flex gap-3">
          {STAGES.map((s) => (
            <div key={s.id} className="flex-1 h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{deals.length} deals in pipeline</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage) => (
            <DroppableColumn
              key={stage.id}
              stage={stage}
              deals={deals.filter((d) => d.stage === stage.id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? <DraggableDealCard deal={activeDeal} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDeal} className="space-y-4 mt-2">
            {addError && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{addError}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="deal-lead">Lead *</Label>
              <select
                id="deal-lead"
                value={form.lead_id}
                onChange={(e) => setForm((f) => ({ ...f, lead_id: e.target.value }))}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a lead…</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}{l.company ? ` (${l.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-value">Deal value ($)</Label>
              <Input
                id="deal-value"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 5000"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal-action">Next action</Label>
              <Input
                id="deal-action"
                placeholder="e.g. Schedule demo call"
                value={form.next_action}
                onChange={(e) => setForm((f) => ({ ...f, next_action: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={addLoading}>
                {addLoading ? 'Adding…' : 'Add Deal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
