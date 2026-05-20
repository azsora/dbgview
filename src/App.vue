<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { theme } from './theme';
import { tabStore } from './stores/tabStore';
import { getTabType } from './registry/tabTypeRegistry';
import { eventBus } from './eventBus';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import TabBar from './components/TabBar.vue';
import PanelContainer from './components/PanelContainer.vue';
import RightPanelContainer from './components/RightPanelContainer.vue';
import ContentContainer from './components/ContentContainer.vue';
import StatusBar from './components/StatusBar.vue';
import TabTypeSelector from './components/TabTypeSelector.vue';

const showTypeSelector = ref(false);
const panelPinned = ref(true);
const panelVisible = ref(true);
const rightPanelPinned = ref(false);
const rightPanelVisible = ref(false);
let draggedTabId: string | null = null;
let leftEdgeTimer: ReturnType<typeof setTimeout> | null = null;
let rightEdgeTimer: ReturnType<typeof setTimeout> | null = null;

// 初始化主题监听
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

  // 鼠标边缘检测 - 靠近左边缘时显示面板
  document.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  eventBus.off('tab-drag-started');
  eventBus.off('tab-drag-ended');
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
  // 左边缘检测
  if (!panelPinned.value && e.clientX <= 10) {
    leftEdgeTimer = setTimeout(() => {
      panelVisible.value = true;
    }, 100);
  }
  // 右边缘检测
  if (!rightPanelPinned.value && e.clientX >= window.innerWidth - 10) {
    rightEdgeTimer = setTimeout(() => {
      rightPanelVisible.value = true;
    }, 100);
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
      eventBus.emit({ type: 'tab-dragged-out', tabId, windowId: windowLabel });
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

  // 创建 Tab（使用类型定义的默认配置）
  const defaultConfig: Record<string, any> = {};
  tabType.configItems.forEach(item => {
    defaultConfig[item.key] = item.defaultValue;
  });

  tabStore.createTab(type, title, defaultConfig);
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
        @pinned="handlePanelPinned"
        @visible-change="handlePanelVisible"
      />
      <ContentContainer />
      <RightPanelContainer
        :visible="rightPanelVisible"
        @pinned="handleRightPanelPinned"
        @visible-change="handleRightPanelVisible"
      />
    </div>

    <StatusBar />

    <TabTypeSelector
      v-if="showTypeSelector"
      @select="handleSelectTabType"
      @close="handleCloseSelector"
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