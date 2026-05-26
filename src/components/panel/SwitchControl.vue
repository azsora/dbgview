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
    <el-switch
      :model-value="value"
      @change="emit('update', $event)"
    />
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
</style>
