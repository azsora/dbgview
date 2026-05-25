use log::{info, error};
use probe_rs::probe::list::Lister;
use probe_rs::{Permissions, Session};
use probe_rs::config::TargetSelector;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

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
}

impl DebuggerManager {
    pub fn new() -> Self {
        Self { session: None }
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