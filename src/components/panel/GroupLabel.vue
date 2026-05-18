<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
  <div class="group-label">{{ text }}</div>
</template>

<style scoped>
.group-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin: 16px 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-color);
}
</style>
