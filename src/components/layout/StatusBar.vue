<script setup lang="ts">
import { computed } from 'vue';
import { tabStore } from '../../stores/tabStore';
import SerialStatus from '../status/SerialStatus.vue';
import DebuggerStatus from '../status/DebuggerStatus.vue';

const activeTab = computed(() => tabStore.activeTab.value);

// 根据标签页类型返回对应的状态组件
const statusComponent = computed(() => {
  if (!activeTab.value) return null;

  switch (activeTab.value.type) {
    case 'serial-assistant':
      return SerialStatus;
    case 'debugger-assistant':
      return DebuggerStatus;
    default:
      return null;
  }
});
</script>

<template>
  <div class="status-bar">
    <component
      v-if="statusComponent"
      :is="statusComponent"
    />
    <span v-else class="no-status">无活动标签页</span>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: var(--status-bar-bg);
  color: #fff;
  font-size: 12px;
}

.no-status {
  color: rgba(255, 255, 255, 0.5);
}
</style>