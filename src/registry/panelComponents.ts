// src/registry/panelComponents.ts
// 面板组件统一注册入口

import SerialPanelLayout from '../components/panel/SerialPanelLayout.vue';
import DebuggerPanel from '../components/panel/DebuggerPanel.vue';
import { registerPanel } from './panelRegistry';

// 注册所有面板组件
registerPanel('SerialPanel', SerialPanelLayout);
registerPanel('DebuggerPanel', DebuggerPanel);
// 后续新增面板在此注册