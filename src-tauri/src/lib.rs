// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

mod commands;
mod serial;

use commands::{SerialState, serial_list_ports, serial_open, serial_close, serial_write, serial_read, serial_is_open};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SerialState(std::sync::Mutex::new(serial::SerialManager::new())))
        .invoke_handler(tauri::generate_handler![
            greet,
            serial_list_ports,
            serial_open,
            serial_close,
            serial_write,
            serial_read,
            serial_is_open,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
