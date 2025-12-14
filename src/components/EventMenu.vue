<template>
	<v-menu
		v-if="activatorElement"
		v-model="menu"
		:activator="activatorElement"
		location="bottom start"
		:offset-y="8"
		:offset-x="0"
		max-width="400"
		min-width="300"
		:close-on-content-click="false"
		:close-on-back="true"
		class="event-menu"
	>
		<v-card class="event-menu-card" @click.stop :ripple="false">
				<div class="event-menu-close">
					<v-btn icon  size="x-small" variant="text" @click="closeMenu">
						<v-icon size="18">mdi-close</v-icon>
					</v-btn>
				</div>
			<v-card-text class="px-6 my-3">
				<v-form ref="formRef">
					<v-text-field
						v-model="formData.name"
						label="event name"
						:rules="[rules.required, rules.maxLength]"
						maxlength="30"
						variant="plain"
						density="compact"
						hide-details="auto"
						class="mb-3 event-field"
					/>

					<v-text-field
						v-model="formData.date"
						label="event date"
						type="date"
						:rules="[rules.required]"
						variant="plain"
						density="compact"
						hide-details="auto"
						class="mb-3 event-field"
					>

					</v-text-field>

					<v-text-field
						v-model="formData.time"
						label="event time"
						type="time"
						variant="plain"
						density="compact"
						hide-details="auto"
						class="mb-3 event-field"
					>
					</v-text-field>

					<v-textarea
						v-model="formData.notes"
						label="notes"
						variant="plain"
						density="compact"
						rows="2"
						hide-details="auto"
						class="mb-3 event-field"
					/>

					<div class="mb-3">
						<label class="text-caption text-medium-emphasis mb-2 d-block">Color</label>
						<div class="d-flex gap-2 flex-wrap">
							<v-btn
								v-for="color in colorOptions"
								:key="color"
								:style="{ backgroundColor: color, borderColor: color }"
								:variant="formData.color === color ? 'flat' : 'outlined'"
								size="small"
								icon
								@click="formData.color = color"
								class="color-picker-btn"
							>
								<v-icon v-if="formData.color === color" size="16" color="white">mdi-check</v-icon>
							</v-btn>
						</div>
					</div>
				</v-form>
			</v-card-text>

			<v-card-actions class="pa-3">
				<v-btn
					v-if="isEditMode"
					color="error"
					variant="text"
					size="small"
					@click="handleDelete"
					class="text-capitalize"
				>
					Discard
				</v-btn>
				<v-spacer />
				<v-btn
					color="grey-darken-1"
					variant="text"
					size="small"
					@click="handleSave"
					class="text-capitalize"
				>
					{{ isEditMode ? 'Edit' : 'Save' }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-menu>
	<v-bottom-sheet
		v-else
		v-model="menu"
		max-width="400"
		class="event-menu-sheet"
	>
		<v-card class="event-menu-card" @click.stop :ripple="false">
			<div class="event-menu-close">
				<v-btn icon  size="x-small" variant="text" @click="closeMenu">
					<v-icon size="18">mdi-close</v-icon>
				</v-btn>
			</div>
			<v-card-text class="px-6 my-3">
				<v-form ref="formRef">
					<v-text-field
						v-model="formData.name"
						label="event name"
						:rules="[rules.required, rules.maxLength]"
						maxlength="30"
						variant="plain"
						density="compact"
						hide-details="auto"
						class="mb-3 event-field"
					/>

					<v-text-field
						v-model="formData.date"
						label="event date"
						type="date"
						:rules="[rules.required]"
						variant="plain"
						density="compact"
						hide-details="auto"
						class="mb-3 event-field"
					>
					</v-text-field>

					<v-text-field
						v-model="formData.time"
						label="event time"
						type="time"
						variant="plain"
						density="compact"
						hide-details="auto"
						class="mb-3 event-field"
					>
					</v-text-field>

					<v-textarea
						v-model="formData.notes"
						label="notes"
						variant="plain"
						density="compact"
						rows="2"
						hide-details="auto"
						class="mb-3 event-field"
					/>

					<div class="mb-3">
						<label class="text-caption text-medium-emphasis mb-2 d-block">Color</label>
						<div class="d-flex gap-2 flex-wrap">
							<v-btn
								v-for="color in colorOptions"
								:key="color"
								:style="{ backgroundColor: color, borderColor: color }"
								:variant="formData.color === color ? 'flat' : 'outlined'"
								size="small"
								icon
								@click="formData.color = color"
								class="color-picker-btn"
							>
								<v-icon v-if="formData.color === color" size="16" color="white">mdi-check</v-icon>
							</v-btn>
						</div>
					</div>
				</v-form>
			</v-card-text>

			<v-card-actions class="pa-3">
				<v-btn
					v-if="isEditMode"
					color="error"
					variant="text"
					size="small"
					@click="handleDelete"
					class="text-capitalize"
				>
					Discard
				</v-btn>
				<v-spacer />
				<v-btn
					color="grey-darken-1"
					variant="text"
					size="small"
					@click="handleSave"
					class="text-capitalize"
				>
					{{ isEditMode ? 'Edit' : 'Save' }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-bottom-sheet>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { format, isValid } from 'date-fns';
import type { CalendarEvent } from '@/types/event';

const props = defineProps<{
	modelValue: boolean;
	activator?: HTMLElement | null;
	event?: CalendarEvent | null;
	selectedDate?: Date | null;
	selectedTime?: string;
}>();

const activatorElement = computed(() => {
	return props.activator || undefined;
});

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
	save: [event: Omit<CalendarEvent, 'id'> | CalendarEvent];
	delete: [id: string];
}>();

const formRef = ref();

const formData = ref({
	name: '',
	date: '',
	time: '',
	color: '#2196F3',
	notes: '',
});

const isEditMode = computed(() => !!props.event);

const colorOptions = [
	'#2196F3',
	'#4CAF50',
	'#FF9800',
	'#F44336',
	'#9C27B0',
	'#00BCD4',
	'#FFEB3B',
	'#795548',
	'#607D8B',
	'#E91E63',
];

const rules = {
	required: (v: string) => !!v || 'Required field',
	maxLength: (v: string) => (v && v.length <= 30) || 'Max 30 characters',
};

watch(
	() => props.modelValue,
	newVal => {
		if (newVal) {
			if (props.event) {
				try {
					const eventDate = props.event.date instanceof Date ? props.event.date : new Date(props.event.date)
					if (isValid(eventDate)) {
						formData.value = {
							name: props.event.name,
							date: format(eventDate, 'yyyy-MM-dd'),
							time: props.event.time || '',
							color: props.event.color || '#2196F3',
							notes: props.event.notes || '',
						};
					}
				} catch (error) {
				}
			} else if (props.selectedDate) {
				try {
					const selectedDate = props.selectedDate instanceof Date ? props.selectedDate : new Date(props.selectedDate)
					if (isValid(selectedDate)) {
						formData.value = {
							name: '',
							date: format(selectedDate, 'yyyy-MM-dd'),
							time: props.selectedTime || '',
							color: '#2196F3',
							notes: '',
						};
					} else {
						formData.value = {
							name: '',
							date: format(new Date(), 'yyyy-MM-dd'),
							time: props.selectedTime || '',
							color: '#2196F3',
							notes: '',
						};
					}
				} catch (error) {
					formData.value = {
						name: '',
						date: format(new Date(), 'yyyy-MM-dd'),
						time: props.selectedTime || '',
						color: '#2196F3',
						notes: '',
					};
				}
			} else {
				formData.value = {
					name: '',
					date: format(new Date(), 'yyyy-MM-dd'),
					time: '',
					color: '#2196F3',
					notes: '',
				};
			}
		}
	}
);

const menu = computed({
	get: () => props.modelValue,
	set: value => emit('update:modelValue', value),
});

const closeMenu = () => {
	menu.value = false;
	formData.value = {
		name: '',
		date: '',
		time: '',
		color: '#2196F3',
		notes: '',
	};
};

const handleSave = async () => {
	const { valid } = await formRef.value.validate();
	if (!valid) return;

	let eventDate: Date
	try {
		eventDate = new Date(formData.value.date)
		if (isNaN(eventDate.getTime())) {
			return
		}
	} catch (error) {
		return
	}

	const eventData = {
		name: formData.value.name,
		date: eventDate,
		time: formData.value.time || undefined,
		color: formData.value.color,
		notes: formData.value.notes || undefined,
		...(isEditMode.value && props.event ? { id: props.event.id } : {}),
	};

	setTimeout(() => {
		emit('save', eventData as Omit<CalendarEvent, 'id'> | CalendarEvent);
		menu.value = false;
	}, 300);
};

const handleDelete = () => {
	if (props.event) {
		emit('delete', props.event.id);
		menu.value = false;
	}
};
</script>

<style scoped>
.event-menu-sheet {
	max-width: 400px;
	margin: 0 auto;
}

.event-menu-card {
	border-radius: 12px !important;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.v-bottom-sheet .event-menu-card {
	border-radius: 12px 12px 0 0 !important;
}
.event-menu-close {
	position: absolute;
	top: 8px;
	right: 8px;
}

.event-field :deep(.v-field__input) {
	padding: 8px 0;
	min-height: 32px;
}

.event-field :deep(.v-label) {
	font-size: 14px;
	color: rgba(0, 0, 0, 0.6);
	text-transform: none;
}

.event-field :deep(.v-field__input input),
.event-field :deep(.v-field__input textarea) {
	font-size: 14px;
}

.event-field :deep(.v-field) {
	border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.event-field :deep(.v-field--focused) {
	border-bottom-color: rgba(0, 0, 0, 0.3);
}

.gap-2 {
	gap: 8px;
}

.color-picker-btn {
	min-width: 36px !important;
	width: 36px;
	height: 36px;
}
</style>
