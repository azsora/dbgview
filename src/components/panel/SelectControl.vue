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
  (e: 'scroll', event: Event): void;
}>();

const startTime = performance.now();

// 初始化完成时打印耗时
onMounted(() => {
  console.log('SelectControl mounted:', props.label, performance.now() - startTime, 'ms');
});

function handleChange(value: string | number) {
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

function handleScroll(event: Event) {
  emit('scroll', event);
}
</script>

<template>
  <div class="control select-control">
    <label class="control-label">{{ label }}</label>
    <el-select
      :model-value="value"
      class="control-select"
      placeholder="请选择"
      :filterable="filterable"
      :allow-create="false"
      :default-first-option="false"
      :reserve-keyword="true"
      :loading="false"
      :virtual="true"
      :scrollbar="true"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
      @visible-change="handleVisibleChange"
      @filter="emit('filter', $event)"
      @scroll="handleScroll"
    >
      <el-option
        v-for="opt in options"
        :key="String(opt.value)"
        :label="String(opt.label)"
        :value="String(opt.value)"
      />
      <template #empty>
        <span>空</span>
      </template>
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
