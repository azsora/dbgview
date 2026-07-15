// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

mod commands;
mod serial;

use commands::{DebuggerState, DebuggerManager, SerialState, serial_list_ports, serial_open, serial_close, serial_write, serial_is_open, serial_set_dtr, serial_set_rts, serial_read_cts, serial_read_dsr, debugger_list_probes, debugger_list_chips, debugger_list_chips_count, debugger_list_chips_paged, debugger_connect, debugger_disconnect, debugger_is_connected};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    log::info!("[应用] 调试工具启动...");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        // 初始化 Tauri 官方日志插件（兼容 log crate API，业务代码 info!/warn!/error! 无需修改）
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(SerialState(std::sync::Mutex::new(serial::SerialManager::new())))
        .manage(DebuggerState(std::sync::Mutex::new(DebuggerManager::new())))
        .invoke_handler(tauri::generate_handler![
            greet,
            serial_list_ports,
            serial_open,
            serial_close,
            serial_write,
            serial_is_open,
            serial_set_dtr,
            serial_set_rts,
            serial_read_cts,
            serial_read_dsr,
            debugger_list_probes,
            debugger_list_chips,
            debugger_list_chips_count,
            debugger_list_chips_paged,
            debugger_connect,
            debugger_disconnect,
            debugger_is_connected,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
