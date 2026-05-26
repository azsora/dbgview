<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { theme } from './theme';
import { tabStore } from './stores/tabStore';
import { debuggerStore } from './stores/debuggerStore';
import { eventBus } from './eventBus';
import { getTabType } from './registry/tabTypeRegistry';
import TabBar from './components/tabs/TabBar.vue';
import TabManager from './components/tabs/TabManager.vue';
import LayoutManager from './components/layout/LayoutManager.vue';
import ContentContainer from './components/layout/ContentContainer.vue';
import StatusBar from './components/layout/StatusBar.vue';
import TabTypeSelector from './components/tabs/TabTypeSelector.vue';
import PanelContainer from './components/layout/LeftPanel.vue';
import RightPanelContainer from './components/layout/RightPanel.vue';

const showTypeSelector = ref(false);
const tabManagerRef = ref<InstanceType<typeof TabManager> | null>(null);

// 左面板状态
const panelVisible = ref(false);
const panelPinned = ref(false);

// 右面板状态
const rightPanelVisible = ref(false);
const rightPanelPinned = ref(false);

// 初始化面板钉住状态（根据激活标签页）
function initPanelPinnedFromActiveTab() {
  const activeTab = tabStore.activeTab.value;
  if (!activeTab) {
    panelPinned.value = false;
    rightPanelPinned.value = false;
    return;
  }

  const tabType = getTabType(activeTab.type);
  if (!tabType) return;

  panelPinned.value = tabType.leftPanelPinned ?? false;
  rightPanelPinned.value = tabType.rightPanelPinned ?? false;

  // 钉住时直接显示
  if (panelPinned.value) panelVisible.value = true;
  if (rightPanelPinned.value) rightPanelVisible.value = true;
}

// 左面板事件处理
function handlePanelPinned(pinned: boolean) {
  panelPinned.value = pinned;
  if (pinned) panelVisible.value = true;
}

function handlePanelVisible(visible: boolean) {
  panelVisible.value = visible;
}

// 右面板事件处理
function handleRightPanelPinned(pinned: boolean) {
  rightPanelPinned.value = pinned;
  if (pinned) rightPanelVisible.value = true;
}

function handleRightPanelVisible(visible: boolean) {
  rightPanelVisible.value = visible;
}

// 是否显示状态栏（有激活标签页时显示）
const showStatusBar = computed(() => !!tabStore.activeTab.value);

function handleNewTab() {
  showTypeSelector.value = true;
}

function handleSelectTabType(type: string) {
  showTypeSelector.value = false;
  tabManagerRef.value?.handleSelectTabType(type);
}

function handleCloseSelector() {
  showTypeSelector.value = false;
}

// 边缘检测触发
function handleShowLeftPanel() {
  if (!panelPinned.value) panelVisible.value = true;
}

function handleShowRightPanel() {
  if (!rightPanelPinned.value) rightPanelVisible.value = true;
}

onMounted(() => {
  theme.initThemeListener();
  initPanelPinnedFromActiveTab();

  // 后台预加载芯片列表（不阻塞UI）
  debuggerStore.listChips();

  // 监听标签页切换以更新面板钉住状态
  eventBus.on('tab-activated', initPanelPinnedFromActiveTab);
  eventBus.on('tab-created', initPanelPinnedFromActiveTab);
  eventBus.on('tab-closed', initPanelPinnedFromActiveTab);

  // 边缘检测触发
  eventBus.on('show-left-panel', handleShowLeftPanel);
  eventBus.on('show-right-panel', handleShowRightPanel);

  // 窗口关闭前先关闭所有标签页
  window.addEventListener('beforeunload', () => {
    tabStore.closeAllTabs();
  });
});

onUnmounted(() => {
  eventBus.off('tab-activated', initPanelPinnedFromActiveTab);
  eventBus.off('tab-created', initPanelPinnedFromActiveTab);
  eventBus.off('tab-closed', initPanelPinnedFromActiveTab);
  eventBus.off('show-left-panel', handleShowLeftPanel);
  eventBus.off('show-right-panel', handleShowRightPanel);
});
</script>

<template>
  <div class="app" :data-theme="theme.appliedTheme.value">
    <TabManager ref="tabManagerRef" />
    <TabBar @new-tab="handleNewTab" />

    <LayoutManager>
      <template #left>
        <PanelContainer
          :visible="panelVisible"
          :initial-pinned="panelPinned"
          @pinned="handlePanelPinned"
          @visible-change="handlePanelVisible"
        />
      </template>
      <template #center>
        <ContentContainer />
      </template>
      <template #right>
        <RightPanelContainer
          :visible="rightPanelVisible"
          :initial-pinned="rightPanelPinned"
          @pinned="handleRightPanelPinned"
          @visible-change="handleRightPanelVisible"
        />
      </template>
    </LayoutManager>

    <StatusBar v-if="showStatusBar" />

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
</style>