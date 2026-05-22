<script setup lang="ts">
import { computed } from 'vue';
import { tabStore } from '../stores/tabStore';
import EmptyPage from './EmptyPage.vue';
import SerialContent from './content/SerialContent.vue';

const activeTab = computed(() => tabStore.activeTab.value);

// 根据 tab 类型返回对应的内容组件
const contentComponent = computed(() => {
  if (!activeTab.value) return null;

  if (activeTab.value.type === 'serial') {
    return SerialContent;
  }

  return null;
});

// 是否为 serial 类型（需要填满内容区）
const isSerialTab = computed(() => activeTab.value?.type === 'serial');
</script>

<template>
  <div class="content-container" :class="{ 'no-padding': isSerialTab }">
    <EmptyPage v-if="!activeTab" />
    <component
      v-else-if="contentComponent"
      :is="contentComponent"
    />
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

.content-container.no-padding {
  padding: 0;
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
