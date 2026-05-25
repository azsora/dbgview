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
      const parsed = JSON.parse(saved);
      // 恢复缺失的 connectionType 和 port 字段（旧数据格式不包含这些字段）
      parsed.tabs = parsed.tabs.map((tab: any) => ({
        ...tab,
        config: {
          connectionType: 'serial',  // 默认连接类型
          port: '',                  // 默认端口
          ...tab.config,
        },
      }));
      return parsed;
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

// 过滤掉扩展配置字段（只排除 Script 结尾的字段）
const filterConfig = (config: Record<string, any>) => Object.fromEntries(
  Object.entries(config).filter(([key]) => !key.endsWith('Script'))
);

// 监听变化自动保存（排除扩展配置）
watch(
  () => ({ tabs: state.tabs, activeTabId: state.activeTabId }),
  (newState) => {
    // 过滤掉扩展配置字段
    const filteredState = {
      ...newState,
      tabs: newState.tabs.map(tab => ({
        ...tab,
        config: filterConfig(tab.config)
      }))
    };
    saveState(filteredState);
  },
  { deep: true }
);

// 页面卸载前保存状态（排除扩展配置）
window.addEventListener('beforeunload', () => {
  const filteredState = {
    tabs: state.tabs.map(tab => ({
      ...tab,
      config: filterConfig(tab.config)
    })),
    activeTabId: state.activeTabId
  };
  saveState(filteredState);
});

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

  // 保存关闭前的类型，用于事件通知
  const closingTab = state.tabs[index];
  const tabType = closingTab?.type;

  state.tabs.splice(index, 1);

  // 如果关闭的是激活 Tab，激活相邻的
  if (state.activeTabId === tabId) {
    const newIndex = Math.min(index, state.tabs.length - 1);
    if (state.tabs[newIndex]) {
      state.tabs[newIndex].isActive = true;
      state.activeTabId = state.tabs[newIndex].id;
    }
  }

  eventBus.emit('tab-closed', { tabId, tabType, config: closingTab.config });
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

  // 保存时排除扩展配置
  const filteredConfig = Object.fromEntries(
    Object.entries(tab.config).filter(([key]) => !key.endsWith('Script'))
  );
  const filteredState = {
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, config: filteredConfig } : t),
    activeTabId: state.activeTabId
  };
  saveState(filteredState);
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