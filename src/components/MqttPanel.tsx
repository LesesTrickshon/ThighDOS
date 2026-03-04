import React, { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';

const BROKER_URL = 'ws://172.30.148.28:9001'; // Using WebSockets for browser-based MQTT
const DEFAULT_TOPIC = 'ThighDOS/Chat';

const MqttPanel: React.FC = () => {
    const [client, setClient] = useState<mqtt.MqttClient | null>(null);
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [topic, setTopic] = useState(DEFAULT_TOPIC);
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState<{ sender: string; text: string; time: string }[]>([]);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatLog]);

    const connectMqtt = () => {
        if (client) {
            client.end();
        }

        setStatus('connecting');
        const newClient = mqtt.connect(BROKER_URL);

        newClient.on('connect', () => {
            setStatus('connected');
            newClient.subscribe(topic);
            const time = new Date().toLocaleTimeString();
            setChatLog(prev => [...prev, { sender: 'System', text: `Connected to room: ${topic}`, time }]);
        });

        newClient.on('message', (_receivedTopic, payload) => {
            const time = new Date().toLocaleTimeString();
            setChatLog(prev => [...prev, { sender: 'Remote', text: payload.toString(), time }]);
        });

        newClient.on('error', (err) => {
            console.error('MQTT Error:', err);
            setStatus('disconnected');
        });

        newClient.on('close', () => {
            setStatus('disconnected');
        });

        setClient(newClient);
    };

    const sendMessage = () => {
        if (client && status === 'connected' && message.trim() !== '') {
            client.publish(topic, message);
            const time = new Date().toLocaleTimeString();
            setChatLog(prev => [...prev, { sender: 'You', text: message, time }]);
            setMessage('');
        }
    };

    return (
        <div className="mqtt-panel" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#1a1a1a', color: '#fff' }}>
            <h2>MQTT Chat & Control</h2>
            <div style={{ marginBottom: '10px' }}>
                <span style={{ marginRight: '10px' }}>
                    Status: <b style={{ color: status === 'connected' ? '#4caf50' : status === 'connecting' ? '#ff9800' : '#f44336' }}>
                        {status.toUpperCase()}
                    </b>
                </span>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Topic/Room"
                    style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '5px' }}
                />
                <button onClick={connectMqtt} style={{ marginLeft: '10px', cursor: 'pointer', padding: '5px 10px' }}>
                    {status === 'connected' ? 'Reconnect' : 'Connect'}
                </button>
            </div>

            <div className="chat-log" style={{ height: '300px', overflowY: 'auto', background: '#000', padding: '10px', borderRadius: '4px', marginBottom: '10px', border: '1px solid #444' }}>
                {chatLog.map((log, index) => (
                    <div key={index} style={{ marginBottom: '5px', fontSize: '0.9em' }}>
                        <span style={{ color: '#888', marginRight: '5px' }}>[{log.time}]</span>
                        <b style={{ color: log.sender === 'You' ? '#94d2bd' : log.sender === 'System' ? '#ee9b00' : '#0a9396' }}>{log.sender}:</b>
                        <span style={{ marginLeft: '5px' }}>{log.text}</span>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <div style={{ display: 'flex' }}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    style={{ flex: 1, background: '#333', color: '#fff', border: '1px solid #555', padding: '10px', borderRadius: '4px 0 0 4px' }}
                />
                <button onClick={sendMessage} style={{ padding: '10px 20px', borderRadius: '0 4px 4px 0', cursor: 'pointer', background: '#005f73', color: '#fff', border: 'none' }}>
                    Send
                </button>
            </div>

            <div style={{ marginTop: '15px', fontSize: '0.8em', color: '#aaa' }}>
                <i>Note: Connecting to {BROKER_URL} via WebSockets. Ensure your broker supports WS on port 9001.</i>
            </div>
        </div>
    );
};

export default MqttPanel;
