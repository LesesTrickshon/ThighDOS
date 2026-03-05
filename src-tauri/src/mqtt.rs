use rumqttc::{AsyncClient, MqttOptions, QoS, Event, Packet};
use serde::{Serialize, Deserialize};
use std::time::Duration;
use tokio::sync::Mutex;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MqttMessage {
    pub topic: String,
    pub payload: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MqttDiscovery {
    pub device_id: String,
    pub config: serde_json::Value,
}

pub struct MqttState {
    pub client: Arc<Mutex<Option<AsyncClient>>>,
}

#[tauri::command]
pub async fn connect_mqtt(
    broker_url: String,
    port: u16,
    state: tauri::State<'_, MqttState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let mut mqttoptions = MqttOptions::new("thighdos_rust_client", broker_url, port);
    mqttoptions.set_keep_alive(Duration::from_secs(5));

    let (client, mut eventloop) = AsyncClient::new(mqttoptions, 10);
    
    // Subscribe to everything for discovery
    client.subscribe("#", QoS::AtMostOnce).await.map_err(|e| e.to_string())?;

    let client_clone = client.clone();
    let mut state_client = state.client.lock().await;
    *state_client = Some(client);

    tokio::spawn(async move {
        loop {
            match eventloop.poll().await {
                Ok(notification) => {
                    if let Event::Incoming(Packet::Publish(publish)) = notification {
                        let topic = publish.topic.clone();
                        let payload = String::from_utf8_lossy(&publish.payload).to_string();

                        // Check for Tasmota Discovery
                        if topic.contains("tasmota/discovery") && topic.ends_with("/config") {
                            if let Ok(config) = serde_json::from_str::<serde_json::Value>(&payload) {
                                let device_id = topic.split('/').nth(2).unwrap_or("unknown").to_string();
                                let discovery = MqttDiscovery { device_id, config };
                                let _ = app_handle.emit("mqtt-discovery", discovery);
                            }
                        }

                        let _ = app_handle.emit("mqtt-message", MqttMessage { topic, payload });
                    }
                }
                Err(e) => {
                    let _ = app_handle.emit("mqtt-error", e.to_string());
                    break;
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn publish_mqtt(
    topic: String,
    payload: String,
    state: tauri::State<'_, MqttState>,
) -> Result<(), String> {
    let client_lock = state.client.lock().await;
    if let Some(client) = client_lock.as_ref() {
        client
            .publish(topic, QoS::AtMostOnce, false, payload)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Not connected".into())
    }
}
