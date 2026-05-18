<script setup lang="ts">
import { computed } from 'vue';
import { tabStore } from '../stores/tabStore';
import TabItem from './TabItem.vue';
import { getTabType } from '../registry/tabTypeRegistry';

const emit = defineEmits<{
  (e: 'newTab'): void;
}>();

const tabs = computed(() => tabStore.state.tabs);
const canClose = computed(() => tabs.value.length > 1);

function handleTabClick(tabId: string) {
  tabStore.activateTab(tabId);
}

function handleTabClose(tabId: string) {
  tabStore.closeTab(tabId);
}

function handleDragStart(tabId: string, event: DragEvent) {
  // 单 Tab 时禁止拖出
  if (tabs.value.length <= 1) {
    event.preventDefault();
    return;
  }

  event.dataTransfer?.setData('application/tab-id', tabId);
}
</script>

<template>
  <div class="tab-bar">
    <div class="tab-list">
      <TabItem
        v-for="tab in tabs"
        :key="tab.id"
        :tab="tab"
        :can-close="canClose"
        @click="handleTabClick(tab.id)"
        @close="handleTabClose(tab.id)"
        @dragstart="(e) => handleDragStart(tab.id, e)"
      />
    </div>
    <button class="new-tab-btn" @click="emit('newTab')" title="新建标签">
      +
    </button>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  align-items: stretch;
  height: 38px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.tab-list {
  display: flex;
  flex: 1;
  align-items: stretch;
  padding: 0 8px;
  gap: 2px;
}

.new-tab-btn {
  padding: 6px 14px;
  margin: 4px 8px;
  background: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.new-tab-btn:hover {
  background: var(--accent-hover);
}
</style>