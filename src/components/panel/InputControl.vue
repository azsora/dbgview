<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
}>();

const emit = defineEmits<{
  (e: 'update', value: string | number): void;
}>();
</script>

<template>
  <div class="control input-control">
    <label class="control-label">{{ label }}</label>
    <input
      type="text"
      class="control-input"
      :value="value"
      @input="emit('update', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped>
/* 与 SelectControl 共享基础样式 */
.control {
  margin-bottom: 12px;
}

.control-label {
  display: block;
  font-size: 12px;
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
  font-size: 13px;
}

.control-input:focus {
  outline: none;
  border-color: var(--accent-color);
}
</style>
