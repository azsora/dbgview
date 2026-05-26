<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { eventBus } from '../../eventBus';
import { TIMEOUT } from '../../constants';
import { tabStore } from '../../stores/tabStore';

// 面板状态通过 props/slots 由 App.vue 管理
// LayoutManager 仅提供边缘检测功能

// 边缘检测定时器
let leftEdgeTimer: ReturnType<typeof setTimeout> | null = null;
let rightEdgeTimer: ReturnType<typeof setTimeout> | null = null;

// 通知 App.vue 显示面板（通过 eventBus）
function notifyShowLeftPanel() {
  eventBus.emit('show-left-panel');
}

function notifyShowRightPanel() {
  eventBus.emit('show-right-panel');
}

// 鼠标边缘检测
function handleMouseMove(e: MouseEvent) {
  if (!tabStore.activeTab.value) return;

  // 左边缘检测
  if (e.clientX <= 10) {
    if (leftEdgeTimer) clearTimeout(leftEdgeTimer);
    leftEdgeTimer = setTimeout(() => {
      leftEdgeTimer = null;
      notifyShowLeftPanel();
    }, TIMEOUT.EDGE_TRIGGER_DELAY);
  }
  // 右边缘检测
  if (e.clientX >= window.innerWidth - 10) {
    if (rightEdgeTimer) clearTimeout(rightEdgeTimer);
    rightEdgeTimer = setTimeout(() => {
      rightEdgeTimer = null;
      notifyShowRightPanel();
    }, TIMEOUT.EDGE_TRIGGER_DELAY);
  }
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  if (leftEdgeTimer) clearTimeout(leftEdgeTimer);
  if (rightEdgeTimer) clearTimeout(rightEdgeTimer);
});
</script>

<template>
  <div class="layout-manager">
    <slot name="left" />
    <slot name="center" />
    <slot name="right" />
  </div>
</template>

<script lang="ts">
export default {
  components: {}
};
</script>

<style scoped>
.layout-manager {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}
</style>