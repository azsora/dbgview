<script setup lang="ts">
import { computed } from 'vue';
import type { Tab } from '../types/tab';
import { eventBus } from '../eventBus';
import { getTabType } from '../registry/tabTypeRegistry';

const props = defineProps<{
  tab: Tab;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'close'): void;
}>();

// 获取 tab 类型定义中的图标
const tabIcon = computed(() => {
  const typeDef = getTabType(props.tab.type);
  return typeDef?.icon ?? '';
});

function handleDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', props.tab.id);
  }
  // 通知全局开始拖拽
  eventBus.emit('tab-drag-started', { tabId: props.tab.id });
}

function handleDragEnd(_e: DragEvent) {
  eventBus.emit('tab-drag-ended', {});
}
</script>

<template>
  <div
    class="tab-item"
    :class="{ active: tab.isActive }"
    :data-tab-id="tab.id"
    draggable="true"
    @click="emit('click')"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <span v-if="tabIcon" class="tab-icon">{{ tabIcon }}</span>
    <span class="tab-title">{{ tab.title }}</span>
    <el-icon class="tab-close" @click.stop="emit('close')">
      <Close />
    </el-icon>
  </div>
</template>

<script lang="ts">
import { Close } from '@element-plus/icons-vue';
export default {
  components: { Close },
};
</script>

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

.tab-icon {
  margin-right: 6px;
  font-size: 14px;
}

.tab-title {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.15s;
}

.tab-item:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  color: var(--text-primary);
}
</style>
