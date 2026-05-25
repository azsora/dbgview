<script setup lang="ts">
import { computed } from 'vue';
import { tabStore } from '../../stores/tabStore';
import SerialContent from './SerialContent.vue';

const activeConfig = computed(() => tabStore.activeTab.value?.config ?? {});
const connectionType = computed(() => activeConfig.value.connectionType || 'serial');
</script>

<template>
  <div class="debugger-content">
    <!-- 串口内容区 -->
    <SerialContent v-if="connectionType === 'serial'" />

    <!-- 调试器内容区（预留） -->
    <div v-else-if="connectionType === 'debugger'" class="placeholder">
      <svg class="placeholder-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
      </svg>
      <div class="placeholder-text">调试器功能开发中...</div>
    </div>

    <!-- BLE 内容区（预留） -->
    <div v-else-if="connectionType === 'ble'" class="placeholder">
      <svg class="placeholder-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 3H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-4-4h3V9.5l1.5 1.5L10 12H8l3-5 3 5h-2l-1.5-1.5V13h3l-4 4z"/>
      </svg>
      <div class="placeholder-text">BLE 功能开发中...</div>
    </div>

    <!-- TCP/UDP 内容区（预留） -->
    <div v-else-if="connectionType === 'tcp-udp'" class="placeholder">
      <svg class="placeholder-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
      <div class="placeholder-text">TCP/UDP 功能开发中...</div>
    </div>
  </div>
</template>

<style scoped>
.debugger-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 14px;
}
</style>