<script setup lang="ts">
import { onMounted } from 'vue';

const props = defineProps<{
  label: string;
  value: string | number;
  options: { label: string; value: string | number }[];
  filterable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update', value: string | number): void;
  (e: 'focus'): void;
  (e: 'dblclick'): void;
  (e: 'visibleChange', visible: boolean): void;
  (e: 'filter', query: string): void;
}>();

const startTime = performance.now();

// 初始化完成时打印耗时
onMounted(() => {
  console.log('SelectControl mounted:', props.label, performance.now() - startTime, 'ms');
});

function handleChange(value: string | number | null) {
  if (value === null) return;
  emit('update', value);
}

function handleFocus() {
  emit('focus');
}

function handleBlur() {
  emit('focus');
}

function handleVisibleChange(visible: boolean) {
  emit('visibleChange', visible);
}
</script>

<template>
  <div class="control select-control">
    <label class="control-label">{{ label }}</label>
    <n-select
      :value="value"
      class="control-select"
      placeholder="请选择"
      :filterable="filterable"
      :virtual-scroll="true"
      :consistent-menu-width="true"
      @update:value="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
      @update:show="handleVisibleChange"
    >
      <n-option
        v-for="opt in options"
        :key="String(opt.value)"
        :label="String(opt.label)"
        :value="opt.value"
      />
    </n-select>
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
