<template>
  <v-app>
    <CalendarView />
  </v-app>
</template>

<script setup lang="ts">
import CalendarView from './components/CalendarView.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Roboto', sans-serif;
}
</style>

