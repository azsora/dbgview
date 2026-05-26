// src/registry/panelRegistry.ts
// 面板组件注册表 - 通过注册机制实现面板的动态加载

import type { Component } from 'vue';

// 面板组件类型
export type PanelComponent = Component;

// 注册表
const registry = new Map<string, PanelComponent>();

// 注册面板组件
export function registerPanel(name: string, component: PanelComponent) {
  registry.set(name, component);
}

// 获取面板组件
export function getPanel(name: string): PanelComponent | undefined {
  return registry.get(name);
}

// 获取所有已注册面板
export function getAllPanels(): Map<string, PanelComponent> {
  return new Map(registry);
}

// 检查面板是否已注册
export function hasPanel(name: string): boolean {
  return registry.has(name);
}