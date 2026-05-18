<script setup lang="ts">
import { computed } from 'vue';
import type { Tab } from '../types/tab';

const props = defineProps<{
  tab: Tab;
  canClose: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'close'): void;
  (e: 'dragstart', event: DragEvent): void;
}>();

const canDrag = computed(() => true); // 单 Tab 时由父组件控制

function handleDragStart(e: DragEvent) {
  if (!canDrag.value) {
    e.preventDefault();
    return;
  }
  e.dataTransfer?.setData('text/plain', props.tab.id);
  emit('dragstart', e);
}
</script>

<template>
  <div
    class="tab-item"
    :class="{ active: tab.isActive, 'can-close': canClose }"
    draggable="true"
    @click="emit('click')"
    @dragstart="handleDragStart"
  >
    <span class="tab-title">{{ tab.title }}</span>
    <button
      v-if="canClose"
      class="tab-close"
      @click.stop="emit('close')"
      title="关闭"
    >
      ×
    </button>
    <button
      v-else
      class="tab-close disabled"
      disabled
      title="单标签不允许关闭"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.tab-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--tab-inactive-bg);
  border: 1px solid var(--border-color);
  border-bottom: none;
  border-radius: 0;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
  position: relative;
}

.tab-item:hover {
  background: var(--bg-secondary);
}

.tab-item.active {
  background: var(--tab-active-bg);
  color: var(--text-primary);
  box-shadow: 0 1px 0 0 var(--tab-active-bg) inset;
}

.tab-item[draggable="true"] {
  cursor: grab;
}

.tab-item[draggable="true"]:active {
  cursor: grabbing;
}

.tab-title {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  margin-left: 8px;
  width: 18px;
  height: 18px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}

.tab-item:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: rgba(0, 0, 0, 0.2);
}

.tab-close.disabled {
  cursor: not-allowed;
  opacity: 0.3 !important;
}
</style>
