import { ref, computed } from 'vue'
import type { CalendarEvent } from '@/types/event'

const events = ref<CalendarEvent[]>([])

export function useEvents() {
  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }
    events.value.push(newEvent)
    saveEvents()
  }

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    const index = events.value.findIndex(e => e.id === id)
    if (index !== -1) {
      events.value[index] = { ...events.value[index], ...updates }
      saveEvents()
    }
  }

  const deleteEvent = (id: string) => {
    events.value = events.value.filter(e => e.id !== id)
    saveEvents()
  }

  const saveEvents = () => {
    localStorage.setItem('calendar-events', JSON.stringify(events.value))
  }

  const loadEvents = () => {
    const stored = localStorage.getItem('calendar-events')
    if (stored) {
      const parsed = JSON.parse(stored)
      events.value = parsed.map((e: any) => ({
        ...e,
        date: new Date(e.date),
      }))
    }
  }

  loadEvents()

  return {
    events: computed(() => events.value),
    addEvent,
    updateEvent,
    deleteEvent,
  }
}

