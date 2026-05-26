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

function handleChange(value: string | number) {
  emit('update', value);
}
</script>

<template>
  <div class="control select-control">
    <label class="control-label">{{ label }}</label>
    <el-select
      :model-value="value"
      class="control-select"
      placeholder="请选择"
      @change="handleChange"
      @focus="emit('focus')"
    >
      <el-option
        v-for="opt in options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>
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

.control-select {
  flex: 1;
  min-width: 0;
}
</style>
