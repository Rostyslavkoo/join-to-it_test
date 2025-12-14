export interface CalendarEvent {
  id: string
  name: string
  date: Date
  time?: string
  color: string
  notes?: string
}

export type ViewType = 'month' | 'week' | 'day' | 'agenda'

