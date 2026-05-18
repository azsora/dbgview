<script setup lang="ts">
defineProps<{
  label: string;
  value: boolean;
}>();

const emit = defineEmits<{
  (e: 'update', value: boolean): void;
}>();
</script>

<template>
  <div class="control switch-control">
    <label class="control-label">{{ label }}</label>
    <div class="switch-row">
      <div
        class="switch"
        :class="{ on: value }"
        @click="emit('update', !value)"
      >
        <div class="switch-thumb"></div>
      </div>
      <span class="switch-status">{{ value ? '已启用' : '已禁用' }}</span>
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

.switch-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch {
  width: 36px;
  height: 20px;
  background: #ccc;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.switch.on {
  background: var(--accent-color);
}

.switch-thumb {
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: left 0.2s;
}

.switch.on .switch-thumb {
  left: 18px;
}

.switch-status {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
