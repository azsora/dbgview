<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { theme } from './theme';
import { tabStore } from './stores/tabStore';
import { getTabType } from './registry/tabTypeRegistry';
import TabBar from './components/TabBar.vue';
import PanelContainer from './components/PanelContainer.vue';
import ContentContainer from './components/ContentContainer.vue';
import StatusBar from './components/StatusBar.vue';
import TabTypeSelector from './components/TabTypeSelector.vue';

const showTypeSelector = ref(false);

// 初始化主题监听
onMounted(() => {
  theme.initThemeListener();
});

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
</script>

<template>
  <div class="app" :data-theme="theme.appliedTheme.value">
    <TabBar @new-tab="handleNewTab" />

    <div class="main-area">
      <PanelContainer />
      <ContentContainer />
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