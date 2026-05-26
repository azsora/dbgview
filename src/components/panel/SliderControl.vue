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
    <el-slider
      :model-value="value"
      :min="min ?? 0"
      :max="max ?? 100"
      class="slider-component"
      @input="emit('update', $event as number)"
    />
    <span class="slider-value">{{ value }}</span>
  </div>
</template>

<style scoped>
.control {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.control-label {
  font-size: 12px;
  color: var(--text-primary);
  margin-right: 8px;
  flex-shrink: 0;
}

.slider-component {
  flex: 1;
  min-width: 0;
}

.slider-value {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 30px;
  text-align: right;
  margin-left: 8px;
  flex-shrink: 0;
}
</style>
