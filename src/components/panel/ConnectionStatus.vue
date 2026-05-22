<script setup lang="ts">
import { computed } from 'vue';
import { serialStore } from '../../stores/serialStore';
import { tabStore } from '../../stores/tabStore';

const status = computed(() => serialStore.state.connectionStatus);
const errorMessage = computed(() => serialStore.state.errorMessage);

const statusText = computed(() => {
  switch (status.value) {
    case 'disconnected':
      return '已关闭';
    case 'connecting':
      return '连接中...';
    case 'connected': {
      const config = tabStore.activeTab.value?.config;
      if (config?.port) {
        return `已连接 @ ${config.port}:${config.baudRate}`;
      }
      return '已连接';
    }
    case 'error':
      return errorMessage.value || '错误';
  }
});

const statusClass = computed(() => status.value);

async function handleToggle() {
  const config = tabStore.activeTab.value?.config;
  if (!config?.port) return;

  if (serialStore.isConnected.value || serialStore.isConnecting.value) {
    await serialStore.closePort();
  } else {
    await serialStore.openPort({
      port: config.port,
      baud_rate: config.baudRate,
      data_bits: config.dataBits,
      stop_bits: config.stopBits,
      parity: config.parity,
      flow_control: config.flowControl,
    });
  }
}

const buttonText = computed(() => {
  if (status.value === 'connected') return '关闭';
  if (status.value === 'connecting') return '打开';
  if (status.value === 'error') return '重试';
  return '打开';
});

const buttonClass = computed(() => {
  if (status.value === 'connected') return 'btn-close';
  if (status.value === 'error') return 'btn-retry';
  return 'btn-open';
});
</script>

<template>
  <div class="connection-status">
    <div class="status-indicator" :class="statusClass">
      <span class="indicator-dot"></span>
      <span class="status-text">{{ statusText }}</span>
    </div>
    <button
      class="toggle-btn"
      :class="buttonClass"
      :disabled="status === 'connecting'"
      @click="handleToggle"
    >
      {{ buttonText }}
    </button>
  </div>
</template>

<style scoped>
.connection-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  margin-top: 8px;
  border-top: 1px solid var(--border-color);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-danger);
}

.status-indicator.connecting .indicator-dot {
  background: var(--color-warning);
  animation: pulse 1s infinite;
}

.status-indicator.connected .indicator-dot {
  background: var(--color-success);
}

.status-indicator.error .indicator-dot {
  background: var(--color-danger);
}

.status-text {
  color: var(--text-secondary);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.toggle-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-open {
  background: var(--color-primary);
  color: white;
}

.btn-close {
  background: var(--color-danger);
  color: white;
}

.btn-retry {
  background: var(--color-warning);
  color: white;
}
</style>
