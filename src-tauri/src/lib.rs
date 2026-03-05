mod mqtt;
use mqtt::{MqttState, connect_mqtt, publish_mqtt};
use std::sync::Arc;
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(MqttState {
      client: Arc::new(Mutex::new(None)),
    })
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![connect_mqtt, publish_mqtt])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
