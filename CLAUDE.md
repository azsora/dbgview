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