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
      <div class="placeholder-icon">🔧</div>
      <div class="placeholder-text">调试器功能开发中...</div>
    </div>

    <!-- BLE 内容区（预留） -->
    <div v-else-if="connectionType === 'ble'" class="placeholder">
      <div class="placeholder-icon">📡</div>
      <div class="placeholder-text">BLE 功能开发中...</div>
    </div>

    <!-- TCP/UDP 内容区（预留） -->
    <div v-else-if="connectionType === 'tcp-udp'" class="placeholder">
      <div class="placeholder-icon">🌐</div>
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