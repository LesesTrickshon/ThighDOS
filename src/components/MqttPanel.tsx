import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { FaCheckSquare, FaTimes, FaExclamationTriangle } from "react-icons/fa";

const BROKER_URL = import.meta.env.VITE_MQTT_BROKER_URL || 'ws://localhost:9001';
const DEFAULT_TOPIC = import.meta.env.VITE_DEFAULT_TOPIC || 'ThighDOS/Chat';

const MqttPanel: React.FC = () => {
    const [client, setClient] = useState<mqtt.MqttClient | null>(null);
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

    // UI State driven by MQTT
    const [currentRequests, setCurrentRequests] = useState(40);
    const [totalRequests, setTotalRequests] = useState(1800);
    const [successful, setSuccessful] = useState(38);
    const [failed, setFailed] = useState(2);
    const [running, setRunning] = useState(1);

    useEffect(() => {
        // Auto-connect on mount
        setStatus('connecting');
        const newClient = mqtt.connect(BROKER_URL);

        newClient.on('connect', () => {
            setStatus('connected');
            newClient.subscribe(DEFAULT_TOPIC);
        });

        newClient.on('message', (_receivedTopic, payload) => {
            try {
                // Expecting JSON: {"current": 45, "total": 1800, "successful": 43, "failed": 2, "running": 1}
                const data = JSON.parse(payload.toString());
                if (data.current !== undefined) setCurrentRequests(data.current);
                if (data.total !== undefined) setTotalRequests(data.total);
                if (data.successful !== undefined) setSuccessful(data.successful);
                if (data.failed !== undefined) setFailed(data.failed);
                if (data.running !== undefined) setRunning(data.running);
            } catch (e) {
                console.log("Received non-JSON MQTT message:", payload.toString());
            }
        });

        newClient.on('error', (err) => {
            console.error('MQTT Error:', err);
            setStatus('disconnected');
        });

        newClient.on('close', () => setStatus('disconnected'));

        setClient(newClient);

        return () => {
            newClient.end();
        };
    }, []);

    const handleStop = () => {
        if (client && status === 'connected') {
            client.publish(DEFAULT_TOPIC, JSON.stringify({ action: "stop" }));
        }
    };

    const progressPercentage = totalRequests > 0 ? (currentRequests / totalRequests) * 100 : 0;

    return (
        <>
            <h2>Request Counter</h2>

            <div className="counter-text">
                {currentRequests} // {totalRequests}
            </div>

            <div className="progress-container">
                <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
            </div>

            <div className="sketch-box" style={{ margin: "10px 0", padding: "10px" }}>
                <div className="status-list">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaCheckSquare color="#00d200" />
                        <span>Successful: {successful}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaTimes color="#ff0000" />
                        <span>Failed: {failed}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaExclamationTriangle color="#ffcc00" />
                        <span>Still Running: {running}</span>
                    </div>
                </div>
            </div>

            <button className="btn btn-stop" onClick={handleStop}>STOP</button>

            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: status === 'connected' ? '#00d200' : '#ff0000', marginTop: '10px' }}>
                MQTT {status.toUpperCase()}
            </div>
        </>
    );
};

export default MqttPanel;
