<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { tabStore } from '../../stores/tabStore';
import { serialStore } from '../../stores/serialStore';
import { getTabType } from '../../registry/tabTypeRegistry';
import { eventBus } from '../../eventBus';

const emit = defineEmits<{
  (e: 'newTab'): void;
}>();

let draggedTabId: string | null = null;
let lastClosedTabConfig: Record<string, any> | null = null;

// 标签页类型选择
function handleSelectTabType(type: string) {
  emit('newTab');  // 通知父组件关闭选择器

  const tabType = getTabType(type);
  if (!tabType) return;

  // 生成带序号的标题
  const existingTabs = tabStore.state.tabs.filter(t => t.type === type);
  let title = tabType.title;
  if (existingTabs.length > 0) {
    title = `${tabType.title}-${existingTabs.length + 1}`;
  }

  // 创建 Tab 配置
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

async function handleCreateWindowFromDrag(tabId: string) {
  const tab = tabStore.state.tabs.find(t => t.id === tabId);
  if (!tab) return;

  const currentTab = tabStore.state.tabs.find(t => t.id === tabId);
  if (!currentTab) return;

  const windowLabel = `tab_window_${Date.now()}`;

  try {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    const webview = new WebviewWindow(windowLabel, {
      title: tab.title,
      width: 800,
      height: 600,
      center: true,
    });

    webview.once('tauri://created', async () => {
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

onMounted(() => {
  eventBus.on('tab-drag-started', ({ tabId }) => {
    draggedTabId = tabId;
  });

  eventBus.on('tab-drag-ended', async () => {
    if (draggedTabId) {
      await handleCreateWindowFromDrag(draggedTabId);
      draggedTabId = null;
    }
  });

  eventBus.on('tab-closed', ({ tabType, config }) => {
    if (tabType === 'serial-assistant') {
      if (serialStore.isConnected.value) {
        serialStore.closePort();
      }
      serialStore.clearReceive();
      lastClosedTabConfig = config;
    }
  });

  eventBus.on('serial-error', ({ error }) => {
    ElMessage.error(`端口打开失败: ${error}`);
  });
});

onUnmounted(() => {
  eventBus.off('tab-drag-started');
  eventBus.off('tab-drag-ended');
  eventBus.off('tab-closed');
  eventBus.off('serial-error');
});

// 暴露给父组件
defineExpose({
  handleSelectTabType
});
</script>