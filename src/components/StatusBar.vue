<script setup lang="ts">
import { computed } from 'vue';
import { tabStore } from '../stores/tabStore';
import { serialStore } from '../stores/serialStore';

// 当前端口信息
const portInfo = computed(() => {
  const config = tabStore.activeTab.value?.config;
  if (!config?.port) return '未连接';
  const baudRate = config.baudRate || '-';
  return `${config.port}@${baudRate}`;
});

// Tx 字节数
const txInfo = computed(() => {
  return `Tx:${serialStore.state.txBytes}`;
});

// Rx 字节数 (总接收字节数-上一次接收字节数)
const rxInfo = computed(() => {
  const { currentRxBytes, rxBytes } = serialStore.state;
  return `Rx:${rxBytes}-${currentRxBytes}`;
});

// 连接状态
const isConnected = computed(() => serialStore.isConnected.value);

// 点击清除 Tx 计数
function resetTx() {
  serialStore.resetTxCounter();
}

// 点击清除 Rx 计数
function resetRx() {
  serialStore.resetRxCounter();
}
</script>

<template>
  <div class="status-bar">
    <el-tag :type="isConnected ? 'success' : 'info'" size="small" class="status-tag">
      <span class="status-dot" :class="{ connected: isConnected }"></span>
      {{ portInfo }}
    </el-tag>
    <el-divider direction="vertical" />
    <span class="status-item clickable" @click="resetTx">{{ txInfo }}</span>
    <el-divider direction="vertical" />
    <span class="status-item clickable" @click="resetRx" :title="`接收总数-上一次接收`">{{ rxInfo }}</span>
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

.status-dot.connected {
  background: #44ff44;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.2s;
}

.status-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.el-divider) {
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.3);
}
</style>