<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { theme } from './theme';
import { tabStore } from './stores/tabStore';
import { serialStore } from './stores/serialStore';
import { getTabType } from './registry/tabTypeRegistry';
import { eventBus } from './eventBus';
import { TIMEOUT } from './constants';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import TabBar from './components/TabBar.vue';
import PanelContainer from './components/PanelContainer.vue';
import RightPanelContainer from './components/RightPanelContainer.vue';
import ContentContainer from './components/ContentContainer.vue';
import StatusBar from './components/StatusBar.vue';
import TabTypeSelector from './components/TabTypeSelector.vue';
import Toast from './components/Toast.vue';

const showTypeSelector = ref(false);
const panelPinned = ref(false);
const panelVisible = ref(false);
const rightPanelPinned = ref(false);
const rightPanelVisible = ref(false);
let draggedTabId: string | null = null;
let leftEdgeTimer: ReturnType<typeof setTimeout> | null = null;
let rightEdgeTimer: ReturnType<typeof setTimeout> | null = null;
let lastClosedTabConfig: Record<string, any> | null = null;  // 保存最后关闭的调试助手标签页配置

// 是否显示状态栏（有激活标签页时显示）
const showStatusBar = computed(() => !!tabStore.activeTab.value);

// Toast 弹窗状态
const toastVisible = ref(false);
const toastMessage = ref('');

function showToast(message: string) {
  toastMessage.value = message;
  toastVisible.value = true;
}

function closeToast() {
  toastVisible.value = false;
}

// 根据激活标签页更新面板状态
function updatePanelStateFromActiveTab() {
  const activeTab = tabStore.activeTab.value;
  if (!activeTab) {
    // 无标签页时隐藏面板
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

// 监听标签页创建、关闭、激活变化
onMounted(() => {
  theme.initThemeListener();

  // 监听拖拽开始
  eventBus.on('tab-drag-started', ({ tabId }) => {
    draggedTabId = tabId;
  });

  // 监听拖拽结束
  eventBus.on('tab-drag-ended', async () => {
    if (draggedTabId) {
      await handleCreateWindowFromDrag(draggedTabId);
      draggedTabId = null;
    }
  });

  // 监听标签页变化
  eventBus.on('tab-created', () => updatePanelStateFromActiveTab());
  eventBus.on('tab-closed', ({ tabType, config }) => {
    updatePanelStateFromActiveTab();
    // 关闭标签页时，如果是串口助手则断开端口并清除接收区
    // 同时保存配置，用于下次创建同类型标签页时恢复
    if (tabType === 'serial-assistant') {
      if (serialStore.isConnected.value) {
        serialStore.closePort();
      }
      serialStore.clearReceive();
      lastClosedTabConfig = config;
    }
  });
  eventBus.on('tab-activated', () => updatePanelStateFromActiveTab());

  // 监听串口错误
  eventBus.on('serial-error', ({ error }) => {
    showToast(`端口打开失败: ${error}`);
  });

  // 鼠标边缘检测 - 靠近左边缘时显示面板
  document.addEventListener('mousemove', handleMouseMove);

  // 初始化面板状态
  updatePanelStateFromActiveTab();
});

onUnmounted(() => {
  eventBus.off('tab-drag-started');
  eventBus.off('tab-drag-ended');
  eventBus.off('tab-created');
  eventBus.off('tab-closed');
  eventBus.off('tab-activated');
  eventBus.off('serial-error');
  document.removeEventListener('mousemove', handleMouseMove);
  if (leftEdgeTimer) {
    clearTimeout(leftEdgeTimer);
  }
  if (rightEdgeTimer) {
    clearTimeout(rightEdgeTimer);
  }
});

// 鼠标边缘检测 - 靠近左边缘时显示左面板，靠近右边缘时显示右面板
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

async function handleCreateWindowFromDrag(tabId: string) {
  const tab = tabStore.state.tabs.find(t => t.id === tabId);
  if (!tab) return;

  // 检查是否还有效（比如在拖拽结束前已关闭）
  const currentTab = tabStore.state.tabs.find(t => t.id === tabId);
  if (!currentTab) return;

  // 生成新窗口 label
  const windowLabel = `tab_window_${Date.now()}`;

  try {
    // 创建新窗口
    const webview = new WebviewWindow(windowLabel, {
      title: tab.title,
      width: 800,
      height: 600,
      center: true,
    });

    // 等待窗口创建完成，然后传递 tab 数据
    webview.once('tauri://created', async () => {
      // 从当前窗口移除 tab
      tabStore.removeTab(tabId);
      eventBus.emit('tab-dragged-out', { tabId, windowId: windowLabel });
    });

    webview.once('tauri://error', (e) => {
      console.error('Failed to create window:', e);
    });
  } catch (err) {
    console.error('Window creation error:', err);
  }
}

function handleNewTab() {
  showTypeSelector.value = true;
}

function handleSelectTabType(type: string) {
  showTypeSelector.value = false;

  // 获取类型定义生成标题
  const tabType = getTabType(type);
  if (!tabType) return;

  // 生成带序号的标题
  const existingTabs = tabStore.state.tabs.filter(t => t.type === type);
  let title = tabType.title;
  if (existingTabs.length > 0) {
    title = `${tabType.title}-${existingTabs.length + 1}`;
  }

  // 创建 Tab 配置
  // 如果是串口助手类型且存在上次关闭的配置，则使用该配置；否则使用类型定义的默认配置
  let tabConfig: Record<string, any> = {};
  if (type === 'serial-assistant' && lastClosedTabConfig) {
    tabConfig = { ...lastClosedTabConfig };
  } else {
    tabType.configItems.forEach(item => {
      tabConfig[item.key] = item.defaultValue;
    });
  }

  tabStore.createTab(type, title, tabConfig);
}

function handleCloseSelector() {
  showTypeSelector.value = false;
}

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
</script>

<template>
  <div class="app" :data-theme="theme.appliedTheme.value">
    <TabBar @new-tab="handleNewTab" />

    <div class="main-area">
      <PanelContainer
        :visible="panelVisible"
        :initial-pinned="panelPinned"
        @pinned="handlePanelPinned"
        @visible-change="handlePanelVisible"
      />
      <ContentContainer />
      <RightPanelContainer
        :visible="rightPanelVisible"
        :initial-pinned="rightPanelPinned"
        @pinned="handleRightPanelPinned"
        @visible-change="handleRightPanelVisible"
      />
    </div>

    <StatusBar v-if="showStatusBar" />

    <TabTypeSelector
      v-if="showTypeSelector"
      @select="handleSelectTabType"
      @close="handleCloseSelector"
    />

    <Toast
      :message="toastMessage"
      :visible="toastVisible"
      :transition="true"
      @close="closeToast"
    />
  </div>
</template>

<style>
@import './assets/theme.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>