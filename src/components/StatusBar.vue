<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { eventBus } from '../eventBus';

const connectionStatus = ref('未连接');
const operationMode = ref('就绪');
const progress = ref('');

let interval: number | null = null;

onMounted(() => {
  // 模拟状态更新（实际项目中替换为真实数据源）
  interval = window.setInterval(() => {
    // 这里可以定期更新状态
  }, 5000);
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
});

// 监听事件更新状态
eventBus.on('config-changed', ({ config }) => {
  if (config.enabled !== undefined) {
    connectionStatus.value = config.enabled ? '已连接' : '未连接';
  }
});
</script>

<template>
  <div class="status-bar">
    <span class="status-item">
      <span class="status-dot" :class="{ connected: connectionStatus === '已连接' }"></span>
      {{ connectionStatus }}
    </span>
    <span class="status-divider">|</span>
    <span class="status-item">操作模式: {{ operationMode }}</span>
    <span class="status-divider">|</span>
    <span class="status-item">{{ progress || '就绪' }}</span>
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
</style>
