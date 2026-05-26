<script setup lang="ts">
import { getAllTabTypes } from '../registry/tabTypeRegistry';

const emit = defineEmits<{
  (e: 'select', type: string): void;
  (e: 'close'): void;
}>();

// 获取所有标签类型
const tabTypes = getAllTabTypes();

function handleSelect(type: string) {
  emit('select', type);
}
</script>

<template>
  <el-dialog
    title="选择标签类型"
    :model-value="true"
    width="320"
    :close-on-click-modal="true"
    @close="emit('close')"
    @update:model-value="emit('close')"
  >
    <div class="type-grid">
      <div
        v-for="tabType in tabTypes"
        :key="tabType.type"
        class="type-card"
        @click="handleSelect(tabType.type)"
      >
        <div class="type-icon">{{ tabType.icon }}</div>
        <div class="type-name">{{ tabType.title }}</div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.type-card {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.type-card:hover {
  border-color: var(--accent-color);
  background: var(--bg-secondary);
}

.type-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.type-name {
  font-size: 14px;
  color: var(--text-primary);
}
</style>