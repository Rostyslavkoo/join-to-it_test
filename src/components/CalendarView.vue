<template>
	<v-container fluid class="pa-0">
		<v-card class="calendar-container" elevation="0">
			<v-card-title
				class="calendar-header d-flex align-center justify-space-between pa-4"
			>
				<div class="d-flex flex-column">
					<h2 class="text-h5 mb-2">Calendar View</h2>
					<v-btn-group variant="flat" color="white"  density="compact">
						<v-btn

							size="small"
							variant="outlined"
							color="primary"
							@click="goToToday"
             
						>
							Today
						</v-btn>
						<v-btn
							variant="outlined"
							color="primary"
							size="small"
							@click="navigateBack"
						>
							Back
						</v-btn>
						<v-btn
							variant="outlined"
							color="primary"
							size="small"
							@click="navigateNext"
						>
							Next
						</v-btn>
					</v-btn-group>
				</div>

				<div class="text-center">
					<div class="text-h6 font-weight-medium">{{ currentDateLabel }}</div>
				</div>

        <v-btn-group variant="flat" color="white"  density="compact">
          <v-btn
            v-for="view in views"
            :key="view"
            :variant="currentView === view ? 'flat' : 'outlined'"
            color="primary"
            size="small"
            rounded
            @click="currentView = view"
          >
            {{ view.charAt(0).toUpperCase() + view.slice(1) }}
          </v-btn>
        </v-btn-group>
			</v-card-title>

			<v-card-text class="pa-0">
				<VuetifyCalendarView
					:current-date="currentDate"
					:current-view="currentView"
					:events="events"
					@date-click="(date, el) => handleDateClick(date, el)"
					@time-click="(date, time, el) => handleTimeClick(date, time, el)"
					@event-click="(event, el) => handleEventClick(event, el)"
					@event-drag="handleEventDrag"
				/>
			</v-card-text>
		</v-card>

		<EventMenu
			v-model="showEventMenu"
			:activator="menuActivator"
			:event="selectedEvent"
			:selected-date="selectedDate"
			:selected-time="selectedTime"
			@save="handleSaveEvent"
			@delete="handleDeleteEvent"
		/>
	</v-container>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import {
	format,
	startOfWeek,
	addWeeks,
	subWeeks,
	addMonths,
	subMonths,
	addDays,
	subDays,
} from 'date-fns';
import type { CalendarEvent, ViewType } from '@/types/event';
import { useEvents } from '@/composables/useEvents';
import VuetifyCalendarView from './VuetifyCalendarView.vue';
import EventMenu from './EventMenu.vue';

const currentDate = ref(new Date());
const currentView = ref<ViewType>('week');
const showEventMenu = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);
const selectedDate = ref<Date | null>(null);
const selectedTime = ref<string>('');
const menuActivator = ref<HTMLElement | null>(null);

const views: ViewType[] = ['month', 'week', 'day', 'agenda'];

const { events, addEvent, updateEvent, deleteEvent } = useEvents();

const currentDateLabel = computed(() => {
	switch (currentView.value) {
		case 'month':
			return format(currentDate.value, 'MMMM yyyy');
		case 'week':
			const weekStart = startOfWeek(currentDate.value, { weekStartsOn: 0 });
			const weekEnd = addDays(weekStart, 6);
			return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
		case 'day':
			return format(currentDate.value, 'EEEE MMM d');
		default:
			return format(currentDate.value, 'MMMM yyyy');
	}
});

const goToToday = () => {
	currentDate.value = new Date();
};

const navigateBack = () => {
	switch (currentView.value) {
		case 'month':
			currentDate.value = subMonths(currentDate.value, 1);
			break;
		case 'week':
			currentDate.value = subWeeks(currentDate.value, 1);
			break;
		case 'day':
			currentDate.value = subDays(currentDate.value, 1);
			break;
		case 'agenda':
			currentDate.value = subMonths(currentDate.value, 1);
			break;
	}
};

const navigateNext = () => {
	switch (currentView.value) {
		case 'month':
			currentDate.value = addMonths(currentDate.value, 1);
			break;
		case 'week':
			currentDate.value = addWeeks(currentDate.value, 1);
			break;
		case 'day':
			currentDate.value = addDays(currentDate.value, 1);
			break;
		case 'agenda':
			currentDate.value = addMonths(currentDate.value, 1);
			break;
	}
};

const handleDateClick = async (date: Date, element?: HTMLElement) => {
	if (showEventMenu.value) {
		return;
	}
	
	if (isNaN(date.getTime())) {
		return
	}
	
	selectedDate.value = new Date(date)
	selectedTime.value = '';
	selectedEvent.value = null;
	menuActivator.value = element || null;
	
	showEventMenu.value = false;
	await nextTick();
	
	setTimeout(() => {
		showEventMenu.value = true;
	}, 10);
};

const handleTimeClick = async (date: Date, time: string, element?: HTMLElement) => {
	if (showEventMenu.value) {
		return;
	}
	
	if (isNaN(date.getTime())) {
		return
	}
	
	selectedDate.value = new Date(date)
	selectedTime.value = time || '';
	selectedEvent.value = null;
	menuActivator.value = element || null;
	
	showEventMenu.value = false;
	await nextTick();
	
	setTimeout(() => {
		showEventMenu.value = true;
	}, 10);
};

const handleEventClick = async (event: CalendarEvent, element?: HTMLElement) => {
	if (showEventMenu.value) return;
	
	selectedEvent.value = event;
	selectedDate.value = event.date;
	menuActivator.value = element || null;
	await nextTick();
	setTimeout(() => {
		showEventMenu.value = true;
	}, 10);
};

const handleSaveEvent = (
	eventData: Omit<CalendarEvent, 'id'> | CalendarEvent
) => {
	if (eventData.date && isNaN(new Date(eventData.date).getTime())) {
		return
	}
	
	if ('id' in eventData && eventData.id) {
		updateEvent(eventData.id, eventData);
	} else {
		addEvent(eventData as Omit<CalendarEvent, 'id'>);
	}
	showEventMenu.value = false;
	selectedEvent.value = null;
	selectedDate.value = null;
	selectedTime.value = '';
	menuActivator.value = null;
};

const handleDeleteEvent = (id: string) => {
	deleteEvent(id);
	showEventMenu.value = false;
	selectedEvent.value = null;
	selectedDate.value = null;
	selectedTime.value = '';
	menuActivator.value = null;
};

const handleEventDrag = (event: CalendarEvent, newDate: Date) => {
	const updates: Partial<CalendarEvent> = { date: newDate };
	
	if (event.time) {
		const hours = newDate.getHours().toString().padStart(2, '0');
		const minutes = newDate.getMinutes().toString().padStart(2, '0');
		updates.time = `${hours}:${minutes}`;
	}
	
	updateEvent(event.id, updates);
};
</script>

<style scoped>
.calendar-container {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

.calendar-header {
	border-bottom: 1px solid rgba(0, 0, 0, 0.12);
	background-color: #fff;
	flex-shrink: 0;
}

:deep(.v-card-text) {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}
</style>
