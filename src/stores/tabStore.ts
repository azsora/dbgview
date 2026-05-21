// src/stores/tabStore.ts
import { reactive, computed, watch } from 'vue';
import { eventBus } from '../eventBus';
import type { Tab, TabState } from '../types/tab';

const STORAGE_KEY = 'tabState';

function generateId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadState(): TabState {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load tab state:', e);
  }
  return { tabs: [], activeTabId: null };
}

function saveState(state: TabState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save tab state:', e);
  }
}

// 创建单例
const state = reactive<TabState>(loadState());

// 监听变化自动保存
watch(
  () => ({ tabs: state.tabs, activeTabId: state.activeTabId }),
  (newState) => {
    saveState(newState);
  },
  { deep: true }
);

// 计算属性
const activeTab = computed(() => {
  return state.tabs.find(t => t.id === state.activeTabId) ?? null;
});

const tabCount = computed(() => state.tabs.length);

// 操作方法
function createTab(type: string, title: string, config: Record<string, any> = {}): Tab {
  const tab: Tab = {
    id: generateId(),
    type,
    title,
    config,
    isActive: true,
  };

  // 激活新 Tab，禁用其他
  state.tabs.forEach(t => t.isActive = false);
  state.tabs.push(tab);
  state.activeTabId = tab.id;

  eventBus.emit('tab-created', { tabId: tab.id, tabType: type });

  return tab;
}

function closeTab(tabId: string) {
  const index = state.tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;

  state.tabs.splice(index, 1);

  // 如果关闭的是激活 Tab，激活相邻的
  if (state.activeTabId === tabId) {
    const newIndex = Math.min(index, state.tabs.length - 1);
    if (state.tabs[newIndex]) {
      state.tabs[newIndex].isActive = true;
      state.activeTabId = state.tabs[newIndex].id;
    }
  }

  eventBus.emit('tab-closed', { tabId });
}

function activateTab(tabId: string) {
  const tab = state.tabs.find(t => t.id === tabId);
  if (!tab) return;

  state.tabs.forEach(t => t.isActive = false);
  tab.isActive = true;
  state.activeTabId = tabId;

  eventBus.emit('tab-activated', { tabId });
}

function updateTabConfig(tabId: string, config: Record<string, any>) {
  const tab = state.tabs.find(t => t.id === tabId);
  if (!tab) return;

  tab.config = { ...tab.config, ...config };
  eventBus.emit('config-changed', { tabId, config: tab.config });
}

function removeTab(tabId: string) {
  const index = state.tabs.findIndex(t => t.id === tabId);
  if (index !== -1) {
    state.tabs.splice(index, 1);
  }
}

function addTab(tab: Tab) {
  state.tabs.push(tab);
}

export const tabStore = {
  state,
  activeTab,
  tabCount,
  createTab,
  closeTab,
  activateTab,
  updateTabConfig,
  removeTab,
  addTab,
};