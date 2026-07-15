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

// n-tag type 枚举与 el-tag 不同，单独映射
const tagType = computed(() => {
  switch (status.value) {
    case 'connected': return 'success';
    case 'error': return 'error';
    case 'connecting': return 'warning';
    default: return 'default';
  }
});

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
      flow_control: config.hardwareFlowControl ? 'RTS/CTS' : 'None',
    });
  }
}

const buttonText = computed(() => {
  if (status.value === 'connected') return '关闭';
  if (status.value === 'connecting') return '打开';
  if (status.value === 'error') return '重试';
  return '打开';
});

const buttonType = computed(() => {
  if (status.value === 'connected') return 'danger';
  if (status.value === 'error') return 'warning';
  return 'primary';
});
</script>

<template>
  <div class="connection-status">
    <n-tag
      :type="tagType"
      size="small"
      :bordered="false"
      style="background: rgba(255,255,255,0.05);"
    >
      <span class="status-dot" :class="statusClass"></span>
      {{ statusText }}
    </n-tag>
    <n-button
      :type="buttonType"
      size="small"
      :disabled="status === 'connecting'"
      @click="handleToggle"
    >
      {{ buttonText }}
    </n-button>
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

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  background: var(--color-danger);
}

.status-dot.connecting {
  background: var(--color-warning);
}

.status-dot.connected {
  background: var(--color-success);
}
</style>
