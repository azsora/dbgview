/** Tab 配置项 */
export interface TabConfigItem {
  key: string;
  label: string;
  type: 'select' | 'input' | 'switch' | 'slider';
  options?: { label: string; value: string | number }[];  // select 专用
  defaultValue?: string | number | boolean;
  min?: number;   // slider 专用
  max?: number;   // slider 专用
}

/** 单个 Tab */
export interface Tab {
  id: string;
  type: string;           // 功能类型
  title: string;           // 显示标题
  config: Record<string, any>;  // 配置参数
  isActive: boolean;
}

/** Tab 状态 */
export interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

/** Tab 类型定义 */
export interface TabTypeDefinition {
  type: string;
  title: string;
  configItems: TabConfigItem[];
  panelComponent: string;  // 组件名称
  contentComponent: string;  // 组件名称
  leftPanelPinned?: boolean;   // 左面板默认钉住状态
  rightPanelPinned?: boolean; // 右面板默认钉住状态
}

/** 事件总线类型 - mitt 适配格式 */
export type TabEvent = {
  'tab-created': { tabId: string; tabType: string };
  'tab-closed': { tabId: string; tabType: string; config: Record<string, any> };
  'tab-activated': { tabId: string };
  'tab-drag-started': { tabId: string };
  'tab-drag-ended': {};
  'tab-dragged-out': { tabId: string; windowId: string };
  'tab-dragged-in': { tabId: string; fromWindowId: string };
  'config-changed': { tabId: string; config: Record<string, any> };
  'main-window-closing': {};
  'child-window-closing': { windowId: string };
  'serial-connected': { port: string };
  'serial-error': { error: string };
  'serial-disconnected': {};
  'serial-data': number[];
};