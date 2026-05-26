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
    <el-input
      :model-value="value"
      class="control-input"
      @input="emit('update', ($event as string))"
    />
  </div>
</template>

<style scoped>
.control {
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.control-label {
  min-width: 50px;
  font-size: var(--font-size);
  color: var(--text-primary);
  margin-right: 5px;
  flex-shrink: 0;
}

.control-input {
  flex: 1;
  min-width: 0;
}
</style>
