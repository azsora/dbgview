<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  options: { label: string; value: string | number }[];
}>();

const emit = defineEmits<{
  (e: 'update', value: string | number): void;
  (e: 'focus'): void;
  (e: 'dblclick'): void;
}>();

function handleChange(e: Event) {
  emit('update', (e.target as HTMLSelectElement).value);
}

function handleDblClick() {
  emit('dblclick');
}
</script>

<template>
  <div class="control select-control">
    <label class="control-label">{{ label }}</label>
    <select
      class="control-input"
      :value="value"
      @change="handleChange"
      @mousedown="emit('focus')"
      @dblclick="handleDblClick"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.control {
  margin-bottom: 5px;
}

.control-label {
  display: block;
  font-size: var(--font-size);
  color: var(--text-primary);
  margin-bottom: 4px;
}

.control-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.control-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.control-input option {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
