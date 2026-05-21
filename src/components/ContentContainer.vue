<script setup lang="ts">
import { computed } from 'vue';
import { tabStore } from '../stores/tabStore';
import EmptyPage from './EmptyPage.vue';

const activeTab = computed(() => tabStore.activeTab.value);
</script>

<template>
  <div class="content-container">
    <EmptyPage v-if="!activeTab" />
    <div v-else class="content-area">
      <!-- 实际项目根据 tab 类型加载对应组件 -->
      <div class="placeholder-content">
        <div class="placeholder-icon">⚙️</div>
        <div class="placeholder-title">{{ activeTab.title }}</div>
        <div class="placeholder-desc">人机交互界面区域</div>
        <div class="placeholder-config">
          当前配置：
          <pre>{{ JSON.stringify(activeTab.config, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-container {
  flex: 1;
  background: var(--bg-primary);
  padding: 20px;
  overflow: auto;
}

.content-area {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  text-align: center;
  color: var(--text-muted);
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.placeholder-title {
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.placeholder-desc {
  font-size: 14px;
  margin-bottom: 16px;
}

.placeholder-config {
  font-size: 12px;
  text-align: left;
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 4px;
  max-width: 300px;
  margin: 0 auto;
}

.placeholder-config pre {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--text-secondary);
}
</style>
