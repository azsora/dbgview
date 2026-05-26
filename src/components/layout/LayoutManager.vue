<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { tabStore } from '../../stores/tabStore';
import { getTabType } from '../../registry/tabTypeRegistry';
import { eventBus } from '../../eventBus';
import { TIMEOUT } from '../../constants';

// 面板状态（内部管理，不再从外部props传入）
const panelPinned = ref(false);
const panelVisible = ref(false);
const rightPanelPinned = ref(false);
const rightPanelVisible = ref(false);

// 边缘检测定时器
let leftEdgeTimer: ReturnType<typeof setTimeout> | null = null;
let rightEdgeTimer: ReturnType<typeof setTimeout> | null = null;

// 根据激活标签页更新面板状态
function updatePanelStateFromActiveTab() {
  const activeTab = tabStore.activeTab.value;
  if (!activeTab) {
    panelVisible.value = false;
    rightPanelVisible.value = false;
    panelPinned.value = false;
    rightPanelPinned.value = false;
    return;
  }

  const tabType = getTabType(activeTab.type);
  if (!tabType) return;

  // 从标签页类型定义获取面板默认钉住状态
  panelPinned.value = tabType.leftPanelPinned ?? false;
  rightPanelPinned.value = tabType.rightPanelPinned ?? false;

  // 根据钉住状态决定是否显示面板
  if (panelPinned.value) {
    panelVisible.value = true;
  }
  if (rightPanelPinned.value) {
    rightPanelVisible.value = true;
  }
}

// 鼠标边缘检测
function handleMouseMove(e: MouseEvent) {
  if (!tabStore.activeTab.value) return;

  // 左边缘检测
  if (!panelPinned.value && e.clientX <= 10) {
    if (leftEdgeTimer) clearTimeout(leftEdgeTimer);
    leftEdgeTimer = setTimeout(() => {
      leftEdgeTimer = null;
      panelVisible.value = true;
    }, TIMEOUT.EDGE_TRIGGER_DELAY);
  }
  // 右边缘检测
  if (!rightPanelPinned.value && e.clientX >= window.innerWidth - 10) {
    if (rightEdgeTimer) clearTimeout(rightEdgeTimer);
    rightEdgeTimer = setTimeout(() => {
      rightEdgeTimer = null;
      rightPanelVisible.value = true;
    }, TIMEOUT.EDGE_TRIGGER_DELAY);
  }
}

// 面板钉住状态变化
function handlePanelPinned(pinned: boolean) {
  panelPinned.value = pinned;
  if (pinned) {
    panelVisible.value = true;
  }
}

function handlePanelVisible(visible: boolean) {
  panelVisible.value = visible;
}

function handleRightPanelPinned(pinned: boolean) {
  rightPanelPinned.value = pinned;
  if (pinned) {
    rightPanelVisible.value = true;
  }
}

function handleRightPanelVisible(visible: boolean) {
  rightPanelVisible.value = visible;
}

onMounted(() => {
  // 监听标签页变化
  eventBus.on('tab-created', () => updatePanelStateFromActiveTab());
  eventBus.on('tab-activated', () => updatePanelStateFromActiveTab());
  eventBus.on('tab-closed', () => updatePanelStateFromActiveTab());

  // 鼠标边缘检测
  document.addEventListener('mousemove', handleMouseMove);

  // 初始化面板状态
  updatePanelStateFromActiveTab();
});

onUnmounted(() => {
  eventBus.off('tab-created');
  eventBus.off('tab-activated');
  eventBus.off('tab-closed');
  document.removeEventListener('mousemove', handleMouseMove);
  if (leftEdgeTimer) clearTimeout(leftEdgeTimer);
  if (rightEdgeTimer) clearTimeout(rightEdgeTimer);
});
</script>

<template>
  <div class="layout-manager">
    <slot />
    <PanelContainer
      :visible="panelVisible"
      :initial-pinned="panelPinned"
      @pinned="handlePanelPinned"
      @visible-change="handlePanelVisible"
    />
    <RightPanelContainer
      :visible="rightPanelVisible"
      :initial-pinned="rightPanelPinned"
      @pinned="handleRightPanelPinned"
      @visible-change="handleRightPanelVisible"
    />
  </div>
</template>

<script lang="ts">
import PanelContainer from './LeftPanel.vue';
import RightPanelContainer from './RightPanel.vue';
export default {
  components: { PanelContainer, RightPanelContainer }
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