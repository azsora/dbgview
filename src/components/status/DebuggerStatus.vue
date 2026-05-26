<script setup lang="ts">
import { computed } from 'vue';
import { tabStore } from '../../stores/tabStore';

// 从配置获取调试器状态
const debuggerInfo = computed(() => {
  const config = tabStore.activeTab.value?.config;
  if (!config) return '未配置';
  const { chipModel, connectionAddress, enabled } = config;
  const status = enabled ? '已启用' : '已禁用';
  return `${chipModel || '-'} @ ${connectionAddress || '-'} | ${status}`;
});

const isEnabled = computed(() => {
  return tabStore.activeTab.value?.config?.enabled ?? false;
});
</script>

<template>
  <div class="debugger-status">
    <el-tag :type="isEnabled ? 'success' : 'info'" size="small" class="status-tag">
      <span class="status-dot" :class="{ active: isEnabled }"></span>
      调试器
    </el-tag>
    <el-divider direction="vertical" />
    <span class="status-item">{{ debuggerInfo }}</span>
  </div>
</template>

<style scoped>
.debugger-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  background: rgba(255, 255, 255, 0.2);
  border: none;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  background: #ff4444;
}

.status-dot.active {
  background: #44ff44;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 3px;
}

:deep(.el-divider) {
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.3);
}
</style>