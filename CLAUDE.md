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
│   ├── stores/            # 状态管理
│   │   ├── tabStore.ts    # Tab 状态管理
│   │   ├── serialStore.ts # 串口状态管理
│   │   └── debuggerStore.ts # 调试助手状态管理
│   ├── types/             # TypeScript 类型定义
│   │   └── tab.ts         # Tab 相关类型
│   ├── registry/          # 注册表
│   │   └── tabTypeRegistry.ts # Tab 类型注册
│   ├── components/        # UI 组件
│   │   ├── panel/         # 面板相关组件
│   │   │   ├── PanelContainer.vue     # 左配置面板
│   │   │   ├── DebuggerPanel.vue     # 调试助手面板（根据连接类型动态渲染）
│   │   │   ├── SelectControl.vue      # 选择控件
│   │   │   └── FlowControlButtons.vue # 流控按钮
│   │   ├── content/       # 内容区组件
│   │   │   ├── SerialContent.vue      # 串口内容区
│   │   │   └── DebuggerContent.vue   # 调试助手内容区（根据连接类型动态渲染）
│   │   ├── RightPanelContainer.vue    # 右属性面板
│   │   ├── ContentContainer.vue       # 主内容区
│   │   ├── TabBar.vue     # 标签栏
│   │   ├── StatusBar.vue  # 状态栏
│   │   ├── Toast.vue      # Toast 弹窗组件
│   │   └── EmptyPage.vue  # 空页面组件
│   └── assets/            # 静态资源
│
├── src-tauri/             # Rust 后端（Tauri）
│   ├── src/
│   │   ├── lib.rs         # 库入口，定义 Tauri 命令和应用初始化
│   │   ├── main.rs        # 二进制入口，调用 lib::run()
│   │   ├── serial.rs      # 串口通信核心模块
│   │   └── commands/      # Tauri 命令模块
│   │       ├── mod.rs
│   │       └── serial_commands.rs
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
- **宽度**：240px
- **图钉功能**：通过图钉按钮切换钉住状态
- **自动隐藏**：未钉住时，鼠标离开 500ms 后自动收起
- **边缘触发**：鼠标靠近窗口左边缘 10px 时自动滑出
- **钉住效果**：钉住后面板占据固定宽度，主内容区自动让位

### 右属性面板（RightPanelContainer.vue）
- **图钉功能**：可通过图钉按钮钉住面板
- **自动隐藏**：未钉住时，鼠标离开 500ms 后自动收起
- **边缘触发**：鼠标靠近右边缘 10px 时自动滑出
- **钉住效果**：钉住后面板保持显示
- 注意：`renderControl(item)` 在模板中被调用 4 次（v-if、:is、v-bind、v-on），后续考虑用 computed 缓存优化

### 状态栏（StatusBar.vue）
- **显示条件**：有激活标签页时显示，空页时隐藏
- **显示内容**：连接端口@波特率 | Tx:发送字节数 | Rx:总接收字节数-当前帧字节数
- **交互**：Tx/Rx 可点击清除对应计数，Rx 悬停显示 tooltip"接收总数-上一次接收"

### 串口助手布局（SerialContent.vue）
- **布局顺序**：接收区 → 控制栏 → 发送区
- **发送区持久化**：发送输入框内容受 F5 刷新影响
- **消息展示**：`[时间戳] Tx->内容` 或 `Rx->内容`，末尾追加，不重建旧消息

## Tauri 命令

通过 `invoke()` 调用 Rust 后端命令。Rust 端使用 `#[tauri::command]` 属性暴露函数给前端调用。

## 依赖说明

- **前端**: Vue 3 (script setup), TypeScript, Vite, Tauri API, @tauri-apps/plugin-dialog
- **后端**: Tauri 2, tauri-plugin-dialog, serde/serde_json (序列化), serialport crate (串口通信)
- **日志**: log + env_logger (后端中文日志)
- **调试库**: probe-rs (嵌入式调试)

## 串口助手功能（现为调试助手的一部分）

调试助手通过 `connectionType` 下拉切换不同连接类型：串口、调试器、BLE、TCP/UDP。

### 连接类型

| 类型 | 值 | 说明 |
|------|-----|------|
| serial | `serial` | 串口连接 |
| debugger | `debugger` | 调试器连接 |
| ble | `ble` | BLE 连接（预留扩展） |
| tcp-udp | `tcp-udp` | TCP/UDP 连接 |

### 左面板组件（DebuggerPanel.vue）
- **连接类型下拉**：顶部下拉选择切换连接类型
- **串口配置**：端口、波特率、数据位、停止位、校验位、流控按钮
- **调试器配置**：芯片型号、连接地址、使能调试、采样阈值
- **TCP/UDP 配置**：IP 地址、端口、协议类型
- **扩展配置**：接收脚本/发送脚本（点击输入框弹出文件选择对话框，支持 .lua/.py/.js/.ts/.sh 等）
- **端口扫描**：仅在点击端口下拉框时扫描可用端口
- **打开/关闭按钮**：连接状态变化时自动更新文字

### 内容区组件（SerialContent.vue）
- **接收区**：显示接收/发送数据，带时间戳（默认激活）
- **控制栏**：时间戳开关、终端模式切换、HEX↑（接收区HEX/ASCII）、HEX↓（发送区HEX/ASCII）、清除按钮
- **发送区**：标准模式下显示，发送后自动清空

### 状态管理（serialStore.ts）
- **持久化**：除扩展配置（`receiveScript`/`sendScript`）外的所有数据在 F5 刷新前保存
- **字节计数**：txBytes（发送）、rxBytes（接收）、currentRxBytes（当前帧）
- **端口关闭标志**：`isPortClosing()` 防止关闭后继续读取
- **消息存储**：`receiveLines` 以 `{ timestamp, data: number[], isTx }[]` 存储原始字节，按 `receiveMode`/`sendMode` 格式化追加到 `receiveBuffer`
- **HEX 切换**：HEX↑/HEX↓ 按钮只影响新接收/发送的消息格式，旧消息保持不变
- **标签页关闭**：关闭调试助手标签页时自动断开端口并清除接收区数据（debugger 类型标签页）
- 关闭标签页时，`tab-closed` 事件会携带 `config`，用于新标签页恢复配置

### 错误处理
- **端口打开失败**：显示 Toast 弹窗，3秒后自动消失，带渐隐效果

## 调试方法

- Rust 端：使用 `cargo build` 编译，检查编译错误
- 前端 TypeScript：通过 `vue-tsc` 类型检查

## 开发注意事项

1. **禁止阻塞操作**：永远不得使用阻塞方式执行任何操作。所有耗时操作（IO、网络、串口通信等）必须采用异步/事件驱动方式：
   - Rust 后端：使用独立线程 + `emit()` 事件推送，或 `tokio` 异步任务
   - 前端：使用 `async/await` + 事件监听，绝不能用 `setInterval` 轮询
   - Tauri 命令（`#[tauri::command]`）是同步的，不得在其中执行阻塞 IO
2. Rust 后端逻辑应在 `src-tauri/src/lib.rs` 中实现
3. 前端通过 `@tauri-apps/api/core` 的 `invoke` 方法调用 Rust 命令
4. 生产构建需同时通过 TypeScript 类型检查
5. Tab 类型定义在 `src/registry/tabTypeRegistry.ts`，内置类型：`debugger`（调试助手，包含 serial/debugger/ble/tcp-udp 四种连接类型）
   - 每个 Tab 类型可设置 `leftPanelPinned` 和 `rightPanelPinned` 控制面板默认状态
6. 左右面板根据 Tab 类型的 `configItems` 动态渲染控件
7. **窗口配置**（tauri.conf.json）：默认 1280x720
8. **Tauri 事件**：`emit("serial-data", data)` 直接发送 `Vec<u8>`，前端直接使用 `payload`（不是包装对象）
9. **UI 控件优先使用 Element Plus**：开发时应优先使用 Element Plus 库提供的组件，避免重复造轮子：
   - 表单控件：`el-input`、`el-select`、`el-switch`、`el-slider`
   - 消息提示：`ElMessage`（`ElMessage.success/warning/error/info`）
   - 对话框：`el-dialog`
   - 按钮：`el-button`、`el-button-group`
   - 状态标签：`el-tag`
   - 分割线：`el-divider`
   - 空状态：`el-empty`
   - 图标：`@element-plus/icons-vue`（如 `Close`、`Plus` 等）
   - 详细组件映射参考：[Element Plus 官方文档](https://element-plus.org/)