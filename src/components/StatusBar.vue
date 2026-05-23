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
    <span class="status-item">
      <span class="status-dot" :class="{ connected: isConnected }"></span>
      {{ portInfo }}
    </span>
    <span class="status-divider">|</span>
    <span class="status-item clickable" @click="resetTx">{{ txInfo }}</span>
    <span class="status-divider">|</span>
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
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4444;
}

.status-dot.connected {
  background: #44ff44;
}

.status-divider {
  opacity: 0.5;
}

.status-item.clickable {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  transition: background 0.2s;
}

.status-item.clickable:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>