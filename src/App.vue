<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { theme } from './theme';
import { tabStore } from './stores/tabStore';
import TabBar from './components/tabs/TabBar.vue';
import TabManager from './components/tabs/TabManager.vue';
import LayoutManager from './components/layout/LayoutManager.vue';
import ContentContainer from './components/layout/ContentContainer.vue';
import StatusBar from './components/layout/StatusBar.vue';
import TabTypeSelector from './components/tabs/TabTypeSelector.vue';

const showTypeSelector = ref(false);
const tabManagerRef = ref<InstanceType<typeof TabManager> | null>(null);

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

onMounted(() => {
  theme.initThemeListener();
});
</script>

<template>
  <div class="app" :data-theme="theme.appliedTheme.value">
    <TabManager ref="tabManagerRef" />
    <TabBar @new-tab="handleNewTab" />

    <LayoutManager>
      <ContentContainer />
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