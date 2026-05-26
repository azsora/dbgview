// src/registry/contentComponents.ts
// 内容组件统一注册入口

import SerialContent from '../components/content/SerialContent.vue';
import DebuggerContent from '../components/content/DebuggerContent.vue';
import ContentPlaceholder from '../components/content/ContentPlaceholder.vue';
import { registerPanel } from './panelRegistry';

// 注册所有内容区组件（内容组件也通过 panelRegistry 管理）
registerPanel('SerialContent', SerialContent);
registerPanel('DebuggerContent', DebuggerContent);
registerPanel('ContentPlaceholder', ContentPlaceholder);