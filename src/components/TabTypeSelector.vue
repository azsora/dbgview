<script setup lang="ts">
import { ref } from 'vue';
import { getAllTabTypes } from '../registry/tabTypeRegistry';

const emit = defineEmits<{
  (e: 'select', type: string): void;
  (e: 'close'): void;
}>();

const tabTypes = getAllTabTypes();

function handleSelect(type: string) {
  emit('select', type);
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>选择标签类型</h3>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="type-grid">
          <div
            v-for="tabType in tabTypes"
            :key="tabType.type"
            class="type-card"
            @click="handleSelect(tabType.type)"
          >
            <div class="type-icon">📦</div>
            <div class="type-name">{{ tabType.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-primary);
  border-radius: 8px;
  min-width: 320px;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 16px;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.type-card {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.type-card:hover {
  border-color: var(--accent-color);
  background: var(--bg-secondary);
}

.type-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.type-name {
  font-size: 14px;
  color: var(--text-primary);
}
</style>