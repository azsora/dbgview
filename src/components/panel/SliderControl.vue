<script setup lang="ts">
defineProps<{
  label: string;
  value: number;
  min?: number;
  max?: number;
}>();

const emit = defineEmits<{
  (e: 'update', value: number): void;
}>();
</script>

<template>
  <div class="control slider-control">
    <label class="control-label">{{ label }}</label>
    <div class="slider-row">
      <input
        type="range"
        class="slider"
        :value="value"
        :min="min ?? 0"
        :max="max ?? 100"
        @input="emit('update', Number(($event.target as HTMLInputElement).value))"
      />
      <span class="slider-value">{{ value }}</span>
    </div>
  </div>
</template>

<style scoped>
.control {
  margin-bottom: 12px;
}

.control-label {
  display: block;
  font-size: 12px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider {
  flex: 1;
  height: 4px;
  appearance: none;
  background: var(--border-color);
  border-radius: 2px;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent-color);
  border-radius: 50%;
  cursor: pointer;
}

.slider-value {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 30px;
  text-align: right;
}
</style>
