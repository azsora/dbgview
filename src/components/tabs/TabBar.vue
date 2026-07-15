<script setup lang="ts">
import { computed } from 'vue';
import { AddOutline } from '@vicons/ionicons5';
import { tabStore } from '../../stores/tabStore';
import TabItem from './TabItem.vue';

const emit = defineEmits<{
  (e: 'newTab'): void;
}>();

const tabs = computed(() => tabStore.state.tabs);

function handleTabClick(tabId: string) {
  tabStore.activateTab(tabId);
}

function handleTabClose(tabId: string) {
  tabStore.closeTab(tabId);
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  const draggedTabId = event.dataTransfer?.getData('text/plain');
  if (!draggedTabId) return;

  const targetEl = (event.target as HTMLElement).closest('.tab-item');
  const targetTabId = targetEl?.getAttribute('data-tab-id');
  if (!targetTabId || draggedTabId === targetTabId) return;

  const fromIndex = tabs.value.findIndex(t => t.id === draggedTabId);
  const toIndex = tabs.value.findIndex(t => t.id === targetTabId);
  if (fromIndex === -1 || toIndex === -1) return;

  const [movedTab] = tabStore.state.tabs.splice(fromIndex, 1);
  tabStore.state.tabs.splice(toIndex, 0, movedTab);
}
</script>

<template>
  <div class="tab-bar">
    <div class="tab-list" @dragover="handleDragOver" @drop="handleDrop">
      <TabItem
        v-for="tab in tabs"
        :key="tab.id"
        :tab="tab"
        @click="handleTabClick(tab.id)"
        @close="handleTabClose(tab.id)"
      />
      <n-button class="new-tab-btn" @click="emit('newTab')" title="新建标签">
        <n-icon><AddOutline /></n-icon>
      </n-button>
    </div>
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
  margin: 0;
}
</style>