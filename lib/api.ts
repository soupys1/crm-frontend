import { createClient } from './supabase'
import type {
  Lead,
  Deal,
  DealStage,
  EmailThread,
  EnrichmentResult,
  DraftResult,
  ApiResponse,
} from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

async function getToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getToken()

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined ?? {}),
    },
  })

  if (!res.ok && res.status !== 400 && res.status !== 404) {
    const text = await res.text()
    return { data: null, error: text || `HTTP ${res.status}` }
  }

  return res.json()
}

export const api = {
  leads: {
    list: () =>
      request<Lead[]>('/api/leads'),

    get: (id: string) =>
      request<Lead>(`/api/leads/${id}`),

    create: (body: { name: string; company?: string; role?: string; email?: string; linkedin_url?: string }) =>
      request<Lead>('/api/leads', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: string, body: Partial<Pick<Lead, 'name' | 'company' | 'role' | 'email' | 'linkedin_url' | 'score'>>) =>
      request<Lead>(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    delete: (id: string) =>
      request<{ deleted: boolean }>(`/api/leads/${id}`, { method: 'DELETE' }),
  },

  deals: {
    list: () =>
      request<Deal[]>('/api/deals'),

    get: (id: string) =>
      request<Deal>(`/api/deals/${id}`),

    create: (body: { lead_id: string; stage?: DealStage; value?: number; next_action?: string }) =>
      request<Deal>('/api/deals', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: string, body: { stage?: DealStage; value?: number; next_action?: string }) =>
      request<Deal>(`/api/deals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    delete: (id: string) =>
      request<{ deleted: boolean }>(`/api/deals/${id}`, { method: 'DELETE' }),
  },

  ai: {
    enrich: (lead_id: string) =>
      request<EnrichmentResult>('/api/ai/enrich', {
        method: 'POST',
        body: JSON.stringify({ lead_id }),
      }),

    draft: (body: { lead_id: string; intent: 'cold' | 'follow_up' | 'breakup'; pitch: string }) =>
      request<DraftResult>('/api/ai/draft', { method: 'POST', body: JSON.stringify(body) }),
  },

  email: {
    threads: (lead_email: string) =>
      request<EmailThread[]>(`/api/email/threads?lead_email=${encodeURIComponent(lead_email)}`),

    send: (body: { to: string; subject: string; body: string }) =>
      request<{ sent: boolean }>('/api/email/send', { method: 'POST', body: JSON.stringify(body) }),
  },
}
