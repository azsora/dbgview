<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: string;
  disabled?: boolean;
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
    <div class="flow-buttons">
      <button
        v-for="opt in flowOptions"
        :key="opt.key"
        class="flow-btn"
        :class="{ active: isActive(opt.key), disabled: props.disabled }"
        :disabled="props.disabled"
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
  justify-content: flex-end;
  margin-bottom: 5px;
}

.flow-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}

.flow-btn {
  padding: 6px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: var(--font-size);
  cursor: pointer;
  transition: all 0.2s;
}

.flow-btn:hover {
  border-color: var(--accent-color);
}

.flow-btn.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.flow-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
