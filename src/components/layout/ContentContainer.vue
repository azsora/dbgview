<script setup lang="ts">
import { computed } from 'vue';
import { tabStore } from '../../stores/tabStore';
import { getTabType } from '../../registry/tabTypeRegistry';
import { getPanel } from '../../registry/panelRegistry';

const activeTab = computed(() => tabStore.activeTab.value);

// 根据激活标签页类型获取内容区组件
const contentComponent = computed(() => {
  if (!activeTab.value) return null;

  const tabType = getTabType(activeTab.value.type);
  if (!tabType?.contentComponent) return null;

  return getPanel(tabType.contentComponent);
});

// 是否需要填满内容区（无 padding）
const isFullArea = computed(() => {
  if (!activeTab.value) return false;
  const type = activeTab.value.type;
  return type === 'serial-assistant' || type === 'debugger-assistant';
});
</script>

<template>
  <div class="content-container" :class="{ 'no-padding': isFullArea }">
    <component
      v-if="contentComponent"
      :is="contentComponent"
    />
    <ContentPlaceholder v-else-if="!activeTab" />
    <div v-else class="content-area">
      <ContentPlaceholder />
    </div>
  </div>
</template>

<script lang="ts">
import ContentPlaceholder from '../content/ContentPlaceholder.vue';
export default {
  components: { ContentPlaceholder }
};
</script>

<style scoped>
.content-container {
  flex: 1;
  background: var(--bg-primary);
  padding: 20px;
  overflow: auto;
}

.content-container.no-padding {
  padding: 0;
}

.content-area {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>