<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update', value: string): void;
}>();

const flowOptions = [
  { key: 'DSR', label: 'DSR' },
  { key: 'CTS', label: 'CTS' },
  { key: 'DTR', label: 'DTR' },
  { key: 'RTS', label: 'RTS' },
];

const activeFlows = computed(() => props.value.split(',').filter(Boolean));

function toggleFlow(flow: string) {
  const current = activeFlows.value;
  const index = current.indexOf(flow);
  if (index >= 0) {
    current.splice(index, 1);
  } else {
    current.push(flow);
  }
  emit('update', current.join(','));
}

function isActive(flow: string) {
  return activeFlows.value.includes(flow);
}
</script>

<template>
  <div class="flow-control">
    <el-button-group>
      <el-button
        v-for="opt in flowOptions"
        :key="opt.key"
        :type="isActive(opt.key) ? 'primary' : 'default'"
        size="small"
        :disabled="props.disabled"
        @click="toggleFlow(opt.key)"
      >
        {{ opt.label }}
      </el-button>
    </el-button-group>
  </div>
</template>

<style scoped>
.flow-control {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 5px;
}
</style>
