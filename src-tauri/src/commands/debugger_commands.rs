use log::{info, error};
use probe_rs::probe::list::Lister;
use probe_rs::{Permissions, Session, config::Registry};
use probe_rs::config::TargetSelector;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{State, Manager};
use tokio::task;

// 芯片/目标信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChipInfo {
    pub name: String,
    pub part_number: Option<u16>,
}

// 调试器信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebuggerInfo {
    pub id: String,
    pub name: String,
}

// Tauri 状态管理
pub struct DebuggerState(pub Mutex<DebuggerManager>);

pub struct DebuggerManager {
    session: Option<Session>,
    chip_cache: Option<Vec<ChipInfo>>,
}

impl DebuggerManager {
    pub fn new() -> Self {
        Self { session: None, chip_cache: None }
    }

    // 扫描可用调试器
    pub fn list_probes() -> Result<Vec<DebuggerInfo>, String> {
        info!("[调试器] 开始扫描可用调试器...");
        let lister = Lister::new();
        let probes = lister.list_all();

        let debuggers: Vec<DebuggerInfo> = probes
            .into_iter()
            .enumerate()
            .map(|(i, probe)| {
                DebuggerInfo {
                    id: format!("probe_{}", i),
                    name: probe.identifier,
                }
            })
            .collect();

        info!("[调试器] 扫描完成，发现 {} 个调试器", debuggers.len());
        Ok(debuggers)
    }

    // 连接到调试器
    pub fn connect(&mut self, debugger_id: &str, chip_model: &str) -> Result<(), String> {
        info!("[调试器] 正在连接调试器: {}, 芯片: {}", debugger_id, chip_model);

        let lister = Lister::new();
        let probes = lister.list_all();

        // 解析调试器索引
        let probe_index = debugger_id
            .trim_start_matches("probe_")
            .parse::<usize>()
            .map_err(|_| "无效的调试器ID")?;

        let probe_info = probes.get(probe_index).ok_or("调试器不存在")?;

        // 打开调试器
        let probe = lister.open(probe_info)
            .map_err(|e| format!("打开调试器失败: {}", e))?;

        // 使用 TargetSelector::Unspecified 通过芯片名称选择目标
        let target = TargetSelector::Unspecified(chip_model.to_string());

        // 附加到目标
        let session = probe.attach(target, Permissions::default())
            .map_err(|e| format!("附加到目标失败: {}", e))?;

        self.session = Some(session);
        info!("[调试器] 连接成功");
        Ok(())
    }

    // 断开调试器
    pub fn disconnect(&mut self) -> Result<(), String> {
        if self.session.is_none() {
            return Err("未连接到调试器".to_string());
        }
        info!("[调试器] 正在断开连接...");
        self.session = None;
        info!("[调试器] 已断开连接");
        Ok(())
    }

    // 检查是否已连接
    pub fn is_connected(&self) -> bool {
        self.session.is_some()
    }
}

impl Default for DebuggerManager {
    fn default() -> Self {
        Self::new()
    }
}

// Tauri 命令实现

#[tauri::command]
pub fn debugger_list_probes() -> Result<Vec<DebuggerInfo>, String> {
    DebuggerManager::list_probes()
}

// 生成芯片列表（在独立线程中执行）
fn generate_chip_list() -> Vec<ChipInfo> {
    let start = std::time::Instant::now();
    info!("[调试器] 开始生成芯片列表（后台线程）...");
    let registry = Registry::from_builtin_families();
    let mut chips: Vec<ChipInfo> = Vec::new();

    for family in registry.families() {
        for chip in family.variants() {
            chips.push(ChipInfo {
                name: chip.name.clone(),
                part_number: chip.part.clone(),
            });
        }
    }

    info!("[调试器] 生成完成，共 {} 个芯片，耗时 {:?}", chips.len(), start.elapsed());
    chips
}

// 获取芯片总数
#[tauri::command]
pub async fn debugger_list_chips_count(app: tauri::AppHandle) -> Result<usize, String> {
    let chips = debugger_list_chips_internal(&app).await?;
    Ok(chips.len())
}

// 分页获取芯片列表
#[tauri::command]
pub async fn debugger_list_chips_paged(
    app: tauri::AppHandle,
    page: usize,
    page_size: usize,
) -> Result<Vec<ChipInfo>, String> {
    let chips = debugger_list_chips_internal(&app).await?;
    let start = page * page_size;
    if start >= chips.len() {
        return Ok(vec![]);
    }
    let end = (start + page_size).min(chips.len());
    Ok(chips[start..end].to_vec())
}

// 内部获取芯片列表（共享逻辑）
async fn debugger_list_chips_internal(app: &tauri::AppHandle) -> Result<Vec<ChipInfo>, String> {
    // 先尝试从内存缓存获取
    let cache = {
        let state = app.state::<DebuggerState>();
        let guard = state.0.lock().ok();
        guard.and_then(|m| m.chip_cache.clone())
    };

    if let Some(cached_chips) = cache {
        info!("[调试器] 使用内存缓存的芯片列表");
        return Ok(cached_chips);
    }

    // 在阻塞线程中执行耗时操作
    let chips = task::spawn_blocking(generate_chip_list)
        .await
        .map_err(|e| format!("线程执行失败: {}", e))?;

    // 更新内存缓存
    let state = app.state::<DebuggerState>();
    if let Ok(mut manager) = state.0.lock() {
        manager.chip_cache = Some(chips.clone());
    }

    Ok(chips)
}

// 获取所有支持的芯片/目标列表
#[tauri::command]
pub async fn debugger_list_chips(app: tauri::AppHandle) -> Result<Vec<ChipInfo>, String> {
    debugger_list_chips_internal(&app).await
}

#[tauri::command]
pub fn debugger_connect(
    state: State<DebuggerState>,
    debugger_id: String,
    chip_model: String,
) -> Result<(), String> {
    info!("[命令] debugger_connect 被调用: debugger_id={}, chip_model={}", debugger_id, chip_model);
    let mut manager = state.0.lock().map_err(|e| {
        error!("[命令] 获取调试器管理器锁失败: {}", e);
        e.to_string()
    })?;
    manager.connect(&debugger_id, &chip_model)
}

#[tauri::command]
pub fn debugger_disconnect(state: State<DebuggerState>) -> Result<(), String> {
    info!("[命令] debugger_disconnect 被调用");
    let mut manager = state.0.lock().map_err(|e| {
        error!("[命令] 获取调试器管理器锁失败: {}", e);
        e.to_string()
    })?;
    manager.disconnect()
}

#[tauri::command]
pub fn debugger_is_connected(state: State<DebuggerState>) -> Result<bool, String> {
    info!("[命令] debugger_is_connected 被调用");
    let manager = state.0.lock().map_err(|e| {
        error!("[命令] 获取调试器管理器锁失败: {}", e);
        e.to_string()
    })?;
    Ok(manager.is_connected())
}