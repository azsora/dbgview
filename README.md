# dbgview

基于 **Tauri 2 + Vue 3 + TypeScript** 的嵌入式离线调试工具，集成串口调试助手与芯片调试器（基于 [probe-rs](https://github.com/probe-rs/probe-rs)），支持多标签页工作流。

## 功能特性

| 模块 | 能力 |
| --- | --- |
| 多标签页 | 串口 / 调试器 / BLE / TCP 等多种功能页签，状态持久化（sessionStorage） |
| 串口调试 | 端口扫描、收发数据、HEX/ASCII、时间戳、自动滚动、发送历史、Tx/Rx 计数、硬件流控、DTR/RTS 信号线手动控制 |
| 嵌入式调试 | 调试器扫描（SWD/JTAG）、芯片列表（内存缓存 + 远程搜索）、连接/断开、会话管理 |
| 面板系统 | 左配置面板 + 中内容区 + 右属性面板，图钉 / 自动隐藏 / 边缘检测 |
| 状态栏 | 根据激活标签页动态渲染（SerialStatus / DebuggerStatus） |

## 技术栈

| 层 | 技术 | 版本 |
| --- | --- | --- |
| 前端框架 | Vue 3 (`<script setup>`) | ^3.5.13 |
| 语言 | TypeScript（ES2020，ESM，`strict` 模式） | ~5.6.2 |
| 构建 | Vite + `@vitejs/plugin-vue` | ^6.0.3 / ^5.2.1 |
| 类型检查 | `vue-tsc` | ^2.1.10 |
| UI 库 | Naive UI + `@vicons/ionicons5` | ^2.40.1 / ^0.13.0 |
| 事件总线 | `mitt` | ^3.0.1 |
| Tauri 桥 | `@tauri-apps/api` + `plugin-dialog` + `plugin-opener` | ^2 |
| 后端框架 | Tauri 2 + Rust（edition 2021） | ^2 |
| 串口 | `serialport` | 4 |
| 嵌入式调试 | `probe-rs` | 0.31 |
| 异步运行时 | `tokio`（`rt-multi-thread`） | 1 |
| 序列化 | `serde` / `serde_json` | 1 |
| 日志 | `tauri-plugin-log`（业务代码继续使用 `log` crate 宏） | 2 |
| 包管理 | pnpm | 11.13.0 |

## 开发命令

```bash
pnpm install         # 安装前端依赖
pnpm dev             # 前端开发（Vite，端口 3000）
pnpm build           # 前端构建（vue-tsc 类型检查 + vite build）
pnpm tauri dev       # Tauri 开发（前端 + Rust 后端，固定端口 3000）
pnpm tauri build     # Tauri 构建（生成安装包）
cargo build          # 仅编译 Rust 后端
pnpm exec vue-tsc    # TypeScript 类型检查
```

## 项目结构

```
dbgview/
├── src/                         # 前端源码（Vue 3 + TypeScript，ESM）
│   ├── App.vue                  # 主应用入口（面板协调、标签页切换）
│   ├── main.ts                  # 入口（注册 Element Plus、面板/内容组件）
│   ├── theme.ts / eventBus.ts   # 主题管理 / 事件总线（mitt）
│   ├── constants.ts             # 时间/通用常量
│   ├── assets/theme.css         # 全局主题样式
│   ├── stores/                  # 状态管理（Vue reactive 单例，非 Pinia）
│   │   ├── tabStore.ts          # 标签页状态（sessionStorage 持久化，过滤 *Script 字段）
│   │   ├── serialStore.ts       # 串口状态（收发缓冲、连接状态、计数、HEX/ASCII）
│   │   └── debuggerStore.ts     # 调试器状态（芯片列表缓存、会话）
│   ├── registry/                # 注册表机制
│   │   ├── tabTypeRegistry.ts   # Tab 类型定义 + 内置配置项模板（serial/TCP/BLE/通用）
│   │   ├── panelRegistry.ts     # 组件注册/获取
│   │   ├── panelComponents.ts   # 面板组件统一注册入口
│   │   └── contentComponents.ts # 内容组件统一注册入口
│   ├── composables/             # 组合式逻辑（如 useBaudRateOptions）
│   ├── types/tab.ts             # Tab 类型定义 + 事件总线类型
│   └── components/
│       ├── common/              # 通用组件（Toast）
│       ├── content/             # 内容区（SerialContent / DebuggerContent / Empty / Placeholder）
│       ├── panel/               # 面板控件（Input/Select/Switch/Slider/GroupLabel/Autocomplete/...）
│       ├── layout/              # 布局（LayoutManager/LeftPanel/RightPanel/StatusBar/ContentContainer）
│       ├── status/              # 状态组件（SerialStatus / DebuggerStatus）
│       └── tabs/                # 标签页（TabBar / TabItem / TabManager / TabTypeSelector）
├── src-tauri/                   # Rust 后端
│   ├── Cargo.toml               # 依赖：tauri、tauri-plugin-log、serialport、probe-rs、tokio
│   ├── tauri.conf.json          # Tauri 配置（1280×720，identifier: com.az.dbgview）
│   ├── capabilities/default.json  # Tauri 2 权限声明（含 log:default）
│   └── src/
│       ├── lib.rs               # 应用入口（注册命令、状态、插件、日志）
│       ├── serial.rs            # 串口管理器（独立读取线程 + emit）
│       └── commands/
│           ├── mod.rs           # 共享状态（SerialState / DebuggerState / DebuggerManager）
│           ├── serial_commands.rs    # 串口命令（端口/读写/流控/信号线）
│           └── debugger_commands.rs  # 调试器命令（扫描/芯片列表/连接/分页）
└── docs/                        # 设计文档（specs/plans）
```

## 架构说明

### 注册表机制

通过 `panelRegistry` 实现「标签页类型 → 面板/内容组件」的动态加载：

```typescript
// 1. 注册组件
registerPanel('SerialPanel', SerialPanelLayout);
registerPanel('SerialContent', SerialContent);

// 2. tabTypeRegistry 定义类型（含 panelComponent/contentComponent）
// 3. 运行时根据 activeTab.type 取组件渲染
const panel = getPanel(tabType.panelComponent);
```

### 面板系统

| 面板 | 宽度 | 默认行为 |
| --- | --- | --- |
| 左配置面板 `LeftPanel` | 240px | 图钉 / 自动隐藏（500ms）/ 边缘触发（10px） |
| 右属性面板 `RightPanel` | 220px | 图钉 / 自动隐藏 / 边缘触发 |

- 面板钉住状态由激活标签页的 `leftPanelPinned` / `rightPanelPinned` 决定
- 无标签页时面板不可用（鼠标靠近边缘也无法唤出）
- `LayoutManager` 统一管理面板状态与边缘检测

### 状态管理

采用 Vue `reactive` 单例模式（非 Pinia），三个 Store 独立管理：

| Store | 职责 | 持久化 |
| --- | --- | --- |
| `tabStore` | 标签页 CRUD、激活切换 | sessionStorage（过滤 `*Script` 字段） |
| `serialStore` | 连接状态、收发缓冲、模式、计数 | sessionStorage |
| `debuggerStore` | 调试器列表、芯片列表（带加载缓存）、会话 | 无 |

### Tauri 命令清单

```rust
// 串口（src-tauri/src/commands/serial_commands.rs）
serial_list_ports()                          // 扫描可用端口
serial_open(port, baud_rate, ...)            // 打开端口 + 启动读取线程
serial_close()                               // 关闭端口 + 停止线程
serial_write(data: Vec<u8>)                  // 写入数据
serial_is_open()                             // 查询状态
serial_set_dtr(state: bool)                  // 设置 DTR 信号线电平（手动模式）
serial_set_rts(state: bool)                  // 设置 RTS 信号线电平（手动模式）
serial_read_cts() -> bool                    // 读取 CTS 信号线电平
serial_read_dsr() -> bool                    // 读取 DSR 信号线电平

// 调试器（src-tauri/src/commands/debugger_commands.rs）
debugger_list_probes()                       // 扫描调试器
debugger_list_chips()                        // 芯片列表（内存缓存）
debugger_list_chips_count()                  // 芯片总数
debugger_list_chips_paged(page, page_size)   // 分页获取
debugger_connect(debugger_id, chip_model)    // 连接调试器
debugger_disconnect()                        // 断开
debugger_is_connected()                      // 查询状态
```

串口数据通过 Tauri 事件 `serial-data` 推送到前端，前端经 `eventBus` 分发。

## 开发约定

1. **禁止阻塞操作**：所有 IO/网络/串口必须异步，使用独立线程 + `emit()` 或 `async/await`
2. **Tauri 命令同步性**：`#[tauri::command]` 默认同步，不得在其中执行阻塞 IO；耗时操作用 `spawn_blocking`
3. **UI 控件**：优先使用 Naive UI（`n-input` / `n-select` / `n-switch` / `n-slider` 等）；消息提示用 `main.ts` 导出的 `message`（`createDiscreteApi` 全局离散 API）
4. **新增 Tab 类型**：在 `tabTypeRegistry.ts` 添加定义 → 在 `panelComponents.ts` / `contentComponents.ts` 注册组件
5. **状态持久化**：敏感/扩展字段（如 `*Script`）需在保存前过滤
6. **日志**：Rust 端继续使用 `log` crate 宏（`info!` / `warn!` / `error!`），由 `tauri-plugin-log` 统一收集；无需手动初始化 logger
7. **安全**：日志/注释中不得输出密钥或 token

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
