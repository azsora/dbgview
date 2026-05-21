# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

本项目是一个基于 Tauri + Vue 3 + TypeScript 的嵌入式离线调试工具，使用 probe-rs 库进行芯片调试。

## 开发命令

```bash
# 前端开发（Vue）
npm run dev

# 前端构建
npm run build

# Tauri 应用开发（同时启动前端和 Rust 后端）
npm run tauri dev

# Tauri 应用构建
npm run tauri build
```

## 技术架构

```
├── src/                    # Vue 前端源码
│   ├── App.vue            # 主应用组件
│   ├── main.ts            # 前端入口
│   ├── constants.ts       # 时间常量（面板隐藏延迟、边缘触发延迟等）
│   ├── components/        # UI 组件
│   │   ├── PanelContainer.vue  # 左配置面板（可钉住/自动隐藏）
│   │   ├── RightPanelContainer.vue # 右属性面板（可钉住/自动隐藏）
│   │   ├── ContentContainer.vue # 主内容区
│   │   ├── TabBar.vue     # 标签栏
│   │   └── StatusBar.vue  # 状态栏
│   └── assets/            # 静态资源
│
├── src-tauri/             # Rust 后端（Tauri）
│   ├── src/
│   │   ├── lib.rs         # 库入口，定义 Tauri 命令和应用初始化
│   │   └── main.rs        # 二进制入口，调用 lib::run()
│   └── Cargo.toml         # Rust 依赖配置
│
└── package.json           # Node.js 前端依赖和脚本
```

## UI 组件特性

### 面板状态规则
- **面板状态由激活标签页决定**：左右面板的默认钉住状态取决于当前激活标签页的类型定义（`TabTypeDefinition.leftPanelPinned` / `rightPanelPinned`）
- **无标签页时面板不可用**：打开软件无标签页时，左右面板完全隐藏，鼠标靠近边缘也无法唤出
- **有标签页时**：根据该标签页类型设定的默认值显示面板，切换标签页后面板状态跟随新标签页

### 左配置面板（PanelContainer.vue）
- **图钉功能**：通过图钉按钮切换钉住状态
- **自动隐藏**：未钉住时，鼠标离开 500ms 后自动收起
- **边缘触发**：鼠标靠近窗口左边缘 10px 时自动滑出
- **钉住效果**：钉住后面板占据固定宽度，主内容区自动让位

### 右属性面板（RightPanelContainer.vue）
- **图钉功能**：可通过图钉按钮钉住面板
- **自动隐藏**：未钉住时，鼠标离开 500ms 后自动收起
- **边缘触发**：鼠标靠近右边缘 10px 时自动滑出
- **钉住效果**：钉住后面板保持显示

## Tauri 命令

通过 `invoke()` 调用 Rust 后端命令。Rust 端使用 `#[tauri::command]` 属性暴露函数给前端调用。

## 依赖说明

- **前端**: Vue 3 (script setup), TypeScript, Vite, Tauri API
- **后端**: Tauri 2, serde/serde_json (序列化)
- **调试库**: probe-rs (嵌入式调试)

## 调试方法

- Rust 端：使用 `cargo build` 编译，检查编译错误
- 前端 TypeScript：通过 `vue-tsc` 类型检查

## 开发注意事项

1. Rust 后端逻辑应在 `src-tauri/src/lib.rs` 中实现
2. 前端通过 `@tauri-apps/api/core` 的 `invoke` 方法调用 Rust 命令
3. 生产构建需同时通过 TypeScript 类型检查
4. Tab 类型定义在 `src/registry/tabTypeRegistry.ts`，内置类型：`serial`（串口助手）、`debug`（调试助手）
   - 每个 Tab 类型可设置 `leftPanelPinned` 和 `rightPanelPinned` 控制面板默认状态
5. 左右面板根据 Tab 类型的 `configItems` 动态渲染控件