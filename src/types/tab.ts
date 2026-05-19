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
}

/** 事件总线类型 */
export type TabEvent =
  | { type: 'tab-created'; tabId: string; tabType: string }
  | { type: 'tab-closed'; tabId: string }
  | { type: 'tab-activated'; tabId: string }
  | { type: 'tab-drag-started'; tabId: string }
  | { type: 'tab-drag-ended' }
  | { type: 'tab-dragged-out'; tabId: string; windowId: string }
  | { type: 'tab-dragged-in'; tabId: string; fromWindowId: string }
  | { type: 'config-changed'; tabId: string; config: Record<string, any> }
  | { type: 'main-window-closing' }
  | { type: 'child-window-closing'; windowId: string };