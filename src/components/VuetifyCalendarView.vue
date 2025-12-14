<template>
  <div class="vuetify-calendar-wrapper">
    <v-calendar
      ref="calendarRef"
      v-model="modelValue"
      :events="calendarEvents"
      :type="calendarType"
      :first-day-of-week="0"
      :event-color="getEventColor"
      :event-ripple="false"
      class="full-height-calendar"
      @click:date="handleDateClick"
      @click:time="handleTimeClick"
      @click:event="(event) => handleEventClick(event)"
      @moved="handleMoved"
      @mousedown:event="startDrag"
      @mousedown:time="startTime"
      @mouseleave="cancelDrag"
      @mousemove:time="mouseMove"
      @mouseup:time="endDrag"
    >
      <template #event="{ event, timed, eventSummary }">
        <div class="v-event-draggable" @click.stop="(e) => handleEventClick(event, e)">
          <component :is="eventSummary"></component>
        </div>
        <div
          v-if="timed"
          class="v-event-drag-bottom"
          @mousedown.stop="extendBottom(event)"
        ></div>
      </template>
    </v-calendar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { format } from 'date-fns'
import type { CalendarEvent, ViewType } from '@/types/event'

const props = defineProps<{
  currentDate: Date
  currentView: ViewType
  events: CalendarEvent[]
}>()

const emit = defineEmits<{
  'date-click': [date: Date, element?: HTMLElement]
  'time-click': [date: Date, time: string, element?: HTMLElement]
  'event-click': [event: CalendarEvent, element?: HTMLElement]
  'event-drag': [event: CalendarEvent, newDate: Date]
}>()

const calendarRef = ref()
const modelValue = ref(props.currentDate)
const dragEvent = ref<any>(null)
const dragTime = ref<number | null>(null)
const createEvent = ref<any>(null)
const createStart = ref<number | null>(null)
const extendOriginal = ref<number | null>(null)
const createElement = ref<HTMLElement | null>(null)

const calendarType = computed(() => {
  const typeMap: Record<ViewType, 'month' | 'week' | 'day'> = {
    month: 'month',
    week: 'week',
    day: 'day',
    agenda: 'month',
  }
  return typeMap[props.currentView] || 'month'
})

const calendarEvents = computed(() => {
  const events = props.events.map(event => {
    const eventDate = new Date(event.date)
    
    let start: number | string
    let end: number | string
    
    if (event.time) {
      const [hours, minutes] = event.time.split(':')
      start = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), parseInt(hours), parseInt(minutes)).getTime()
      const endDate = new Date(start)
      endDate.setHours(endDate.getHours() + 1)
      end = endDate.getTime()
    } else {
      start = format(eventDate, 'yyyy-MM-dd')
      end = format(eventDate, 'yyyy-MM-dd')
    }
    
    const calendarEvent: any = {
      id: event.id,
      name: event.name,
      start,
      end,
      color: event.color,
      originalEvent: event,
    }
    
    if (event.time) {
      calendarEvent.timed = true
    }
    
    return calendarEvent
  })

  if (createEvent.value) {
    events.push(createEvent.value)
  }

  return events
})

const handleDateClick = async (event: Event, timestamp: any) => {
  let clickedDate: Date | null = null
  
  if (timestamp) {
    if (timestamp.date) {
      clickedDate = typeof timestamp.date === 'string' ? new Date(timestamp.date) : timestamp.date
    } else if (timestamp.year !== undefined && timestamp.month !== undefined && timestamp.day !== undefined) {
      clickedDate = new Date(timestamp.year, timestamp.month - 1, timestamp.day)
    } else if (timestamp.year !== undefined && timestamp.month !== undefined) {
      clickedDate = new Date(timestamp.year, timestamp.month - 1, 1)
    }
  }
  
  if (!clickedDate || isNaN(clickedDate.getTime())) {
    clickedDate = new Date(modelValue.value)
  }
  
  if (isNaN(clickedDate.getTime())) {
    return
  }
  
  clickedDate.setHours(0, 0, 0, 0)
  
  await nextTick()
  let element: HTMLElement | undefined
  
  if (event && event.target) {
    const target = event.target as HTMLElement
    element = target
  }
  
  if (!element && event && event.target) {
    const target = event.target as HTMLElement
    element = target.closest('.v-calendar-month__day, .v-calendar-week__day, .v-calendar-day__day') as HTMLElement
  }
  
  if (!element && calendarRef.value?.$el) {
    try {
      const dateStr = format(clickedDate, 'yyyy-MM-dd')
      element = calendarRef.value.$el.querySelector(`[data-date="${dateStr}"]`) as HTMLElement
      
      if (!element) {
        const dayNumber = clickedDate.getDate()
        const allDays = calendarRef.value.$el.querySelectorAll('.v-calendar-month__day, .v-calendar-week__day, .v-calendar-day__day')
        allDays.forEach((el: Element) => {
          const dayText = el.textContent?.trim() || ''
          if (dayText.match(new RegExp(`^${dayNumber}\\b`))) {
            element = el as HTMLElement
          }
        })
      }
    } catch (error) {
    }
  }
  
  emit('date-click', clickedDate, element)
}

const handleTimeClick = async (event: Event, timestamp: any) => {
  let clickedDate: Date | null = null
  let clickedTime: string = ''
  
  if (timestamp) {
    if (timestamp.date) {
      clickedDate = typeof timestamp.date === 'string' ? new Date(timestamp.date) : timestamp.date
    } else if (timestamp.year !== undefined && timestamp.month !== undefined && timestamp.day !== undefined) {
      clickedDate = new Date(timestamp.year, timestamp.month - 1, timestamp.day)
    }
    
    if (timestamp.hour !== undefined && timestamp.minute !== undefined) {
      const hours = timestamp.hour.toString().padStart(2, '0')
      const minutes = timestamp.minute.toString().padStart(2, '0')
      clickedTime = `${hours}:${minutes}`
    } else if (timestamp.time) {
      clickedTime = timestamp.time
    }
  }
  
  if (!clickedDate || isNaN(clickedDate.getTime())) {
    clickedDate = new Date(modelValue.value)
  }
  
  clickedDate.setHours(0, 0, 0, 0)
  
  if (!clickedTime) {
    const now = new Date()
    clickedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }
  
  await nextTick()
  let element: HTMLElement | undefined
  
  if (event && event.target) {
    const target = event.target as HTMLElement
    element = target
  }
  
  if (!element && event && event.target) {
    const target = event.target as HTMLElement
    element = target.closest('.v-calendar-week__time, .v-calendar-day__time, .v-calendar-month__day, .v-calendar-week__day, .v-calendar-day__day') as HTMLElement
  }
  
  emit('time-click', clickedDate, clickedTime, element)
}

const handleEventClick = async (event: any, clickEvent?: Event) => {
  const originalEvent = event.originalEvent || event
  if (originalEvent && originalEvent.id) {
    await nextTick()
    let element: HTMLElement | undefined
    
    if (clickEvent?.target) {
      element = (clickEvent.target as HTMLElement).closest('.calendar-event') as HTMLElement || clickEvent.target as HTMLElement
    } else if (calendarRef.value?.$el) {
      const eventElements = calendarRef.value.$el.querySelectorAll('.calendar-event')
      eventElements.forEach((el: Element) => {
        if (el.textContent?.includes(originalEvent.name)) {
          element = el as HTMLElement
        }
      })
    }
    
    emit('event-click', originalEvent as CalendarEvent, element)
  }
}

function startDrag(_nativeEvent: Event, { event, timed }: { event: any, timed: boolean }) {
  if (event && timed) {
    dragEvent.value = event
    dragTime.value = null
    extendOriginal.value = null
  }
}

function startTime(nativeEvent: Event, tms: any) {
  const mouse = toTime(tms)

  if (dragEvent.value && dragTime.value === null) {
    const start = typeof dragEvent.value.start === 'number' ? dragEvent.value.start : toTimeFromString(dragEvent.value.start)
    dragTime.value = mouse - start
  } else {
    createStart.value = roundTime(mouse)
    const endDate = new Date(createStart.value)
    endDate.setHours(endDate.getHours() + 1)
    
    createEvent.value = {
      name: 'New Event',
      color: '#2196F3',
      start: createStart.value,
      end: endDate.getTime(),
      timed: true,
    }

    if (nativeEvent && nativeEvent.target) {
      createElement.value = nativeEvent.target as HTMLElement
    }
  }
}

function extendBottom(event: any) {
  createEvent.value = event
  createStart.value = typeof event.start === 'number' ? event.start : toTimeFromString(event.start)
  extendOriginal.value = typeof event.end === 'number' ? event.end : toTimeFromString(event.end)
}

function mouseMove(_nativeEvent: Event, tms: any) {
  const mouse = toTime(tms)

  if (dragEvent.value && dragTime.value !== null) {
    const start = typeof dragEvent.value.start === 'number' ? dragEvent.value.start : toTimeFromString(dragEvent.value.start)
    const end = typeof dragEvent.value.end === 'number' ? dragEvent.value.end : toTimeFromString(dragEvent.value.end)
    const duration = end - start
    const newStartTime = mouse - dragTime.value
    const newStart = roundTime(newStartTime)
    const newEnd = newStart + duration

    dragEvent.value.start = newStart
    dragEvent.value.end = newEnd
  } else if (createEvent.value && createStart.value !== null) {
    const mouseRounded = roundTime(mouse, false)
    const min = Math.min(mouseRounded, createStart.value)
    const max = Math.max(mouseRounded, createStart.value)

    createEvent.value.start = min
    createEvent.value.end = max
  }
}

async function endDrag() {
  if (dragEvent.value) {
    const originalEvent = dragEvent.value.originalEvent
    if (originalEvent) {
      const newDate = new Date(dragEvent.value.start)
      emit('event-drag', originalEvent, newDate)
    }
  } else if (createEvent.value && createStart.value !== null) {
    const startDate = new Date(createEvent.value.start)
    const time = format(startDate, 'HH:mm')
    
    await nextTick()
    let element: HTMLElement | undefined = createElement.value || undefined
    
    if (!element && calendarRef.value?.$el) {
      try {
        const hour = startDate.getHours()
        const minute = startDate.getMinutes()
        
        const allTimeSlots = calendarRef.value.$el.querySelectorAll('.v-calendar-week__time, .v-calendar-day__time, .v-calendar-week__day, .v-calendar-day__day')
        allTimeSlots.forEach((el: Element) => {
          const elText = el.textContent?.trim() || ''
          const timeMatch = elText.match(/(\d{1,2}):(\d{2})/)
          if (timeMatch) {
            const elHour = parseInt(timeMatch[1])
            const elMinute = parseInt(timeMatch[2])
            if (elHour === hour && Math.abs(elMinute - minute) <= 15) {
              element = el as HTMLElement
            }
          }
        })
        
        if (!element && createEvent.value) {
          const eventElements = calendarRef.value.$el.querySelectorAll('.v-event')
          eventElements.forEach((el: Element) => {
            if (el.getAttribute('data-event-id') === createEvent.value?.id || 
                (el.textContent?.includes('New Event') && createEvent.value.name === 'New Event')) {
              element = el as HTMLElement
            }
          })
        }
      } catch (error) {
      }
    }
    
    emit('time-click', startDate, time, element)
  }

  dragTime.value = null
  dragEvent.value = null
  createEvent.value = null
  createStart.value = null
  extendOriginal.value = null
  createElement.value = null
}

function cancelDrag() {
  if (createEvent.value) {
    if (extendOriginal.value) {
      createEvent.value.end = extendOriginal.value
    }
  }

  createEvent.value = null
  createStart.value = null
  dragTime.value = null
  dragEvent.value = null
  createElement.value = null
}

function roundTime(time: number, down = true) {
  const roundTo = 15
  const roundDownTime = roundTo * 60 * 1000

  return down
    ? time - time % roundDownTime
    : time + (roundDownTime - (time % roundDownTime))
}

function toTime(tms: any) {
  return new Date(tms.year, tms.month - 1, tms.day, tms.hour, tms.minute).getTime()
}

function toTimeFromString(timeStr: string) {
  const [datePart, timePart] = timeStr.split(' ')
  if (timePart) {
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    return new Date(year, month - 1, day, hours, minutes).getTime()
  } else {
    const [year, month, day] = datePart.split('-').map(Number)
    return new Date(year, month - 1, day).getTime()
  }
}

function getEventColor(event: any) {
  if (!event.color) return '#2196F3'
  
  const rgb = parseInt(event.color.substring(1), 16)
  const r = (rgb >> 16) & 0xFF
  const g = (rgb >> 8) & 0xFF
  const b = (rgb >> 0) & 0xFF

  if (event === dragEvent.value || event === createEvent.value) {
    return `rgba(${r}, ${g}, ${b}, 0.7)`
  }
  
  return event.color
}


const handleMoved = (data: { year: number; month: number; day?: number }) => {
  const newDate = new Date(data.year, data.month - 1, data.day || 1)
  modelValue.value = newDate
}

watch(() => props.currentDate, (newDate) => {
  modelValue.value = newDate
})

watch(() => props.currentView, () => {
  if (calendarRef.value) {
    modelValue.value = props.currentDate
  }
})
</script>

<style scoped>
.vuetify-calendar-wrapper {
  width: 100%;
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
}

:deep(.full-height-calendar) {
  height: 100%;
  min-height: calc(100vh - 200px);
}

:deep(.v-calendar) {
  height: 100%;
  width: 100%;
}

:deep(.v-calendar__container) {
  height: 100%;
  width: 100%;
}

:deep(.v-calendar-month__day) {
  min-height: 120px;
}

:deep(.v-calendar-week__day) {
  min-height: 100px;
}

:deep(.v-calendar-day__day) {
  min-height: 80px;
}

.v-event-draggable {
  padding-left: 6px;
}

.v-event-timed {
  user-select: none;
  -webkit-user-select: none;
}

.v-event-drag-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4px;
  height: 4px;
  cursor: ns-resize;
}

.v-event-drag-bottom::after {
  display: none;
  position: absolute;
  left: 50%;
  height: 4px;
  border-top: 1px solid white;
  border-bottom: 1px solid white;
  width: 16px;
  margin-left: -8px;
  opacity: 0.8;
  content: '';
}

.v-event-drag-bottom:hover::after {
  display: block;
}
</style>

