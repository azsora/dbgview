# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 Tauri + Vue 3 + TypeScript 的嵌入式离线调试工具，使用 probe-rs 库进行芯片调试。

## 开发命令

```bash
pnpm install      # 安装前端依赖
pnpm dev          # 前端开发
pnpm build        # 前端构建
pnpm tauri dev    # Tauri 开发（前端+Rust后端）
pnpm tauri build  # Tauri 构建
```

## 技术架构

```
src/
├── App.vue                    # 主应用入口
├── main.ts                    # 前端入口（注册面板/内容组件）
├── constants.ts               # 时间常量
├── eventBus.ts                # 事件总线
├── theme.ts                   # 主题管理
├── stores/                    # 状态管理
│   ├── tabStore.ts            # Tab 状态
│   ├── serialStore.ts         # 串口状态
│   └── debuggerStore.ts       # 调试助手状态
├── composables/               # 组合式逻辑（useBaudRateOptions 等）
├── types/tab.ts               # Tab 类型定义
├── registry/                  # 注册表
│   ├── tabTypeRegistry.ts     # Tab 类型定义（panelComponent/contentComponent）
│   ├── panelRegistry.ts      # 面板组件注册表
│   ├── panelComponents.ts    # 面板组件统一注册
│   └── contentComponents.ts  # 内容组件统一注册
└── components/
    ├── common/                # 通用组件
    ├── content/               # 内容区（SerialContent, DebuggerContent, EmptyPage...）
    ├── layout/                # 布局管理
    │   ├── LayoutManager.vue  # 布局与面板协调（边缘检测、面板状态）
    │   ├── ContentContainer.vue
    │   ├── LeftPanel.vue      # 左配置面板（registry驱动）
    │   ├── RightPanel.vue     # 右属性面板
    │   └── StatusBar.vue      # 状态栏（动态渲染SerialStatus/DebuggerStatus）
    ├── panel/                 # 面板控件
    ├── status/                # 状态组件（SerialStatus, DebuggerStatus）
    └── tabs/                  # 标签页管理
        ├── TabBar.vue
        ├── TabItem.vue
        ├── TabManager.vue     # 标签页管理（新建/拖拽窗口）
        └── TabTypeSelector.vue

src-tauri/                     # Rust 后端（Tauri）
```

## UI 组件特性

### 面板状态规则
- **面板状态由激活标签页决定**：左右面板默认钉住状态取决于 `TabTypeDefinition.leftPanelPinned` / `rightPanelPinned`
- **无标签页时面板不可用**：鼠标靠近边缘也无法唤出
- **LayoutManager** 统一管理面板状态和边缘检测逻辑

### 左配置面板（LeftPanel.vue）
- **宽度**：240px，图钉功能，自动隐藏（500ms延迟），边缘触发（10px）
- **动态加载**：通过 `panelRegistry` 根据激活标签页类型动态渲染面板组件

### 右属性面板（RightPanel.vue）
- **宽度**：220px，图钉功能，自动隐藏，边缘触发

### 状态栏（StatusBar.vue）
- **动态渲染**：根据 `tabStore.activeTab.type` 渲染 `SerialStatus` 或 `DebuggerStatus`
- SerialStatus 显示：端口信息 | Tx计数 | Rx计数
- DebuggerStatus 显示：调试器状态

## 组件注册表机制

通过 `panelRegistry` 实现组件的动态加载：
```typescript
// panelComponents.ts 注册面板
registerPanel('SerialPanel', SerialPanelLayout);
registerPanel('DebuggerPanel', DebuggerPanel);

// contentComponents.ts 注册内容
registerPanel('SerialContent', SerialContent);
registerPanel('DebuggerContent', DebuggerContent);

// 使用
const component = getPanel(tabType.contentComponent);
```

## 依赖说明

- **前端**: Vue 3 (script setup), TypeScript, Vite, Tauri API, Element Plus
- **后端**: Tauri 2, tauri-plugin-dialog, serialport crate, probe-rs

## 调试方法

```bash
cargo build      # Rust 编译
vue-tsc          # TypeScript 类型检查
```

## 开发注意事项

1. **禁止阻塞操作**：所有 IO/网络/串口必须异步，使用独立线程+`emit()`或`async/await`
2. **Tauri 命令**（`#[tauri::command]`）是同步的，不得执行阻塞 IO
3. **UI 控件优先使用 Element Plus**：el-input、el-select、el-switch、el-slider、ElMessage 等
4. **新增 Tab 类型**：在 `tabTypeRegistry.ts` 添加定义，在 `panelComponents.ts` 注册面板组件