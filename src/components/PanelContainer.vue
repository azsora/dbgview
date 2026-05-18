<script setup lang="ts">
import { computed, watch } from 'vue';
import { tabStore } from '../stores/tabStore';
import { getTabType } from '../registry/tabTypeRegistry';
import type { TabConfigItem } from '../types/tab';
import SelectControl from './panel/SelectControl.vue';
import InputControl from './panel/InputControl.vue';
import SwitchControl from './panel/SwitchControl.vue';
import SliderControl from './panel/SliderControl.vue';

const activeConfig = computed(() => tabStore.activeTab.value?.config ?? {});

function updateConfig(key: string, value: any) {
  const activeTab = tabStore.activeTab.value;
  if (!activeTab) return;

  tabStore.updateTabConfig(activeTab.id, { [key]: value });
}

const configItems = computed(() => {
  const activeTab = tabStore.activeTab.value;
  if (!activeTab) return [];

  const tabType = getTabType(activeTab.type);
  return tabType?.configItems ?? [];
});

function renderControl(item: TabConfigItem) {
  const value = activeConfig.value[item.key] ?? item.defaultValue;

  switch (item.type) {
    case 'select':
      return {
        component: SelectControl,
        props: {
          label: item.label,
          value,
          options: item.options ?? [],
        },
        on: { update: (v: any) => updateConfig(item.key, v) },
      };
    case 'input':
      return {
        component: InputControl,
        props: {
          label: item.label,
          value,
        },
        on: { update: (v: any) => updateConfig(item.key, v) },
      };
    case 'switch':
      return {
        component: SwitchControl,
        props: {
          label: item.label,
          value,
        },
        on: { update: (v: any) => updateConfig(item.key, v) },
      };
    case 'slider':
      return {
        component: SliderControl,
        props: {
          label: item.label,
          value,
          min: item.min,
          max: item.max,
        },
        on: { update: (v: any) => updateConfig(item.key, v) },
      };
    default:
      return null;
  }
}
</script>

<template>
  <div class="panel-container">
    <div class="panel-header">配置面板</div>
    <div class="panel-content">
      <template v-for="item in configItems" :key="item.key">
        <component
          v-if="renderControl(item)"
          :is="renderControl(item)!.component"
          v-bind="renderControl(item)!.props"
          v-on="renderControl(item)!.on"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.panel-container {
  width: 220px;
  background: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
  padding: 12px;
  overflow-y: auto;
}

.panel-header {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 12px;
}

.panel-content {
  /* 内容区滚动 */
}
</style>
