<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  value: string;
}>();

const emit = defineEmits<{
  (e: 'update', value: string): void;
}>();

const flowOptions = [
  { key: 'DSR', label: 'DSR' },
  { key: 'CTS', label: 'CTS' },
  { key: 'DTR', label: 'DTR' },
  { key: 'RTS', label: 'RTS' },
];

const activeFlows = computed(() => props.value.split(',').filter(Boolean));

function toggleFlow(flow: string) {
  const current = activeFlows.value;
  const index = current.indexOf(flow);
  if (index >= 0) {
    current.splice(index, 1);
  } else {
    current.push(flow);
  }
  emit('update', current.join(','));
}

function isActive(flow: string) {
  return activeFlows.value.includes(flow);
}
</script>

<template>
  <div class="flow-control">
    <label class="flow-label">{{ label }}</label>
    <div class="flow-buttons">
      <button
        v-for="opt in flowOptions"
        :key="opt.key"
        class="flow-btn"
        :class="{ active: isActive(opt.key) }"
        @click="toggleFlow(opt.key)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.flow-control {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.flow-label {
  font-size: 12px;
  color: var(--text-primary);
  min-width: 48px;
  margin-right: 8px;
}

.flow-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.flow-btn {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.flow-btn:hover {
  border-color: var(--accent-color);
}

.flow-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
</style>
