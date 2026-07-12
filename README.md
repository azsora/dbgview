# dbgview

基于 **Tauri 2 + Vue 3 + TypeScript** 的嵌入式离线调试工具，集成串口调试助手与芯片调试器（基于 [probe-rs](https://github.com/probe-rs/probe-rs)），支持多标签页工作流。

## 功能特性

| 模块 | 能力 |
| --- | --- |
| 多标签页 | 串口 / 调试器等多种功能页签，状态持久化（sessionStorage） |
| 串口调试 | 端口扫描、收发数据、HEX/ASCII、时间戳、自动滚动、发送历史、Tx/Rx 计数 |
| 嵌入式调试 | 调试器扫描（SWD/JTAG）、芯片列表（带缓存）、连接/断开、会话管理 |
| 面板系统 | 左配置面板 + 中内容区 + 右属性面板，图钉 / 自动隐藏 / 边缘检测 |
| 状态栏 | 根据激活标签页动态渲染（SerialStatus / DebuggerStatus） |

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3 (`<script setup>`)、TypeScript、Vite 6、Element Plus、mitt（事件总线）、Tauri API |
| 后端 | Tauri 2、Rust 2021 |
| 关键 crate | `serialport`（串口）、`probe-rs`（嵌入式调试）、`tokio`（异步）、`serde`、`env_logger` |

## 开发命令

```bash
npm install          # 安装前端依赖
npm run dev          # 前端开发（Vite，端口 3000）
npm run build        # 前端构建（vue-tsc 类型检查 + vite build）
npm run tauri dev    # Tauri 开发（前端 + Rust 后端）
npm run tauri build  # Tauri 构建（生成安装包）
cargo build          # 仅编译 Rust 后端
vue-tsc              # TypeScript 类型检查
```

## 项目结构

```
dbgview/
├── src/                         # 前端源码
│   ├── App.vue                  # 主应用入口（面板协调、标签页切换）
│   ├── main.ts                  # 入口（注册 Element Plus、面板/内容组件）
│   ├── theme.ts / eventBus.ts   # 主题管理 / 事件总线（mitt）
│   ├── stores/                  # 状态管理（reactive 单例）
│   │   ├── tabStore.ts          # 标签页状态（sessionStorage 持久化）
│   │   ├── serialStore.ts       # 串口状态（收发缓冲、连接状态、计数）
│   │   └── debuggerStore.ts     # 调试器状态（芯片列表缓存、会话）
│   ├── registry/                # 注册表机制
│   │   ├── tabTypeRegistry.ts   # Tab 类型定义 + 配置项模板
│   │   ├── panelRegistry.ts     # 组件注册/获取
│   │   ├── panelComponents.ts   # 面板组件注册入口
│   │   └── contentComponents.ts # 内容组件注册入口
│   ├── types/tab.ts             # Tab 类型定义 + 事件总线类型
│   └── components/
│       ├── content/             # 内容区（Serial/Debugger/Empty）
│       ├── panel/               # 面板控件（输入/选择/开关/滑块/流控）
│       ├── layout/              # 布局（LayoutManager/LeftPanel/RightPanel/StatusBar）
│       ├── status/              # 状态组件（SerialStatus/DebuggerStatus）
│       └── tabs/                # 标签页（TabBar/TabManager/TabTypeSelector）
├── src-tauri/                   # Rust 后端
│   ├── Cargo.toml               # 依赖：tauri、serialport、probe-rs、tokio
│   ├── tauri.conf.json          # Tauri 配置（1280×720，identifier: com.az.dbgview）
│   └── src/
│       ├── lib.rs               # 应用入口（注册命令、状态、日志）
│       ├── serial.rs            # 串口管理器（独立读取线程 + emit）
│       └── commands/
│           ├── serial_commands.rs    # 串口命令
│           └── debugger_commands.rs  # 调试器命令（芯片列表缓存）
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
3. **UI 控件**：优先使用 Element Plus（`el-input` / `el-select` / `el-switch` / `el-slider` / `ElMessage`）
4. **新增 Tab 类型**：在 `tabTypeRegistry.ts` 添加定义 → 在 `panelComponents.ts` / `contentComponents.ts` 注册组件
5. **状态持久化**：敏感/扩展字段（如 `*Script`）需在保存前过滤
6. **安全**：日志/注释中不得输出密钥或 token

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
