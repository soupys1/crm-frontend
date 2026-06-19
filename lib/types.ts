export type LeadScore = 'hot' | 'warm' | 'cold'

export type DealStage =
  | 'prospect'
  | 'contacted'
  | 'meeting_booked'
  | 'closed_won'
  | 'closed_lost'

export interface Lead {
  id: string
  user_id: string
  name: string
  company: string | null
  role: string | null
  email: string | null
  linkedin_url: string | null
  score: LeadScore | null
  ai_summary: string | null
  created_at: string
}

export interface Deal {
  id: string
  user_id: string
  lead_id: string
  stage: DealStage
  value: number | null
  next_action: string | null
  updated_at: string
  leads?: {
    name: string
    company: string | null
    role: string | null
    email: string | null
    score: LeadScore | null
  }
}

export interface EmailThread {
  id: string
  subject: string
  snippet: string
  last_message_at: string
}

export interface EnrichmentResult {
  summary: string
  talking_points: string[]
  score: LeadScore
  suggested_approach: string
  would_call_help: boolean
  call_reasoning: string
  estimated_deal_value: string
}

export interface DraftResult {
  subject: string
  body: string
}

export type ApiSuccess<T> = { data: T; error: null }
export type ApiError = { data: null; error: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError
