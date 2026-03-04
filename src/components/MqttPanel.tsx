import React, { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { FaPlay, FaStop, FaDownload, FaPaperPlane, FaHeart } from 'react-icons/fa';

interface LogEntry {
    id: number;
    type: 'sent' | 'recv' | 'sys';
    text: string;
    time: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MqttPanel: React.FC = () => {
    const [client, setClient] = useState<mqtt.MqttClient | null>(null);
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

    // Connection State
    const [brokerUrl, setBrokerUrl] = useState(import.meta.env.VITE_MQTT_BROKER_URL || 'ws://localhost:9001');
    const [topic, setTopic] = useState(import.meta.env.VITE_DEFAULT_TOPIC || 'ThighDOS/Chat');

    // DOS & Stats
    const [isDosActive, setIsDosActive] = useState(false);
    const [reqAmount, setReqAmount] = useState(100);
    const [reqInterval, setReqInterval] = useState(10);
    const [dosPayload, setDosPayload] = useState('{"msg": "kawaii_test ~"}');
    const [stats, setStats] = useState({ current: 0, total: 0, success: 0, fail: 0 });
    const isDosActiveRef = useRef(false);

    // Chat & Logs
    const [chatInput, setChatInput] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const logIdRef = useRef(0);

    const addLog = (text: string, type: 'sent' | 'recv' | 'sys') => {
        logIdRef.current++;
        setLogs((prev) => {
            const newLogs = [...prev, { id: logIdRef.current, text, type, time: new Date().toLocaleTimeString() }];
            if (newLogs.length > 500) return newLogs.slice(-500); // Prevent memory issues
            return newLogs;
        });
    };

    useEffect(() => {
        // Scroll to bottom of logs
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (client) client.end();
        };
    }, [client]);

    const connectToMqtt = () => {
        if (client) {
            client.end();
            setClient(null);
        }
        setStatus('connecting');
        addLog(`Attempting connection to ${brokerUrl}...`, 'sys');

        const newClient = mqtt.connect(brokerUrl);

        newClient.on('connect', () => {
            setStatus('connected');
            addLog(`Connected to Broker.Subscribing to Topic / Address: ${topic} `, 'sys');
            newClient.subscribe(topic);
        });

        newClient.on('message', (receivedTopic, payload) => {
            const txt = payload.toString();
            // To avoid huge lag during Dos testing, we don't log ALL incoming messages if DOS is active 
            // (assuming they might echo back), but we'll try to log them safely.
            if (!isDosActiveRef.current || Math.random() < 0.05) {
                addLog(`[${receivedTopic}]IN: ${txt} `, 'recv');
            }
        });

        newClient.on('error', (err) => {
            setStatus('disconnected');
            addLog(`MQTT Error: ${err.message} `, 'sys');
        });

        newClient.on('close', () => {
            setStatus('disconnected');
            addLog(`Connection closed.`, 'sys');
        });

        setClient(newClient);
    };

    const disconnectMqtt = () => {
        if (client) {
            client.end();
            setClient(null);
        }
        setStatus('disconnected');
        addLog(`Disconnected by user.`, 'sys');
        setIsDosActive(false);
        isDosActiveRef.current = false;
    };

    const sendChatMessage = () => {
        if (!client || status !== 'connected') return;
        if (!chatInput.trim()) return;

        client.publish(topic, chatInput);
        addLog(`OUT => ${chatInput} `, 'sent');
        setChatInput('');
    };

    const startDosTest = async () => {
        if (!client || status !== 'connected') {
            addLog("Cannot start Test: No MQTT connection. :(", 'sys');
            return;
        }

        setIsDosActive(true);
        isDosActiveRef.current = true;
        setStats({ current: 0, total: reqAmount, success: 0, fail: 0 });
        addLog(`[System] Initializing Cute Stress Test for ${reqAmount} requests at ${reqInterval}ms interval...`, 'sys');

        let currentCount = 0;
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < reqAmount; i++) {
            if (!isDosActiveRef.current) break; // aborted

            try {
                client.publish(topic, dosPayload, { qos: 0 }, (err) => {
                    if (err) failCount++;
                    else successCount++;
                });
            } catch (e) {
                failCount++;
            }
            currentCount++;

            // Update UI Stats every 10 items or if interval > 100, every item
            if (reqInterval > 100 || currentCount % 10 === 0) {
                setStats({ current: currentCount, total: reqAmount, success: successCount, fail: failCount });
            }

            if (reqInterval > 0) {
                await sleep(reqInterval);
            }
        }

        // Final Sync
        setStats({ current: currentCount, total: reqAmount, success: successCount, fail: failCount });
        setIsDosActive(false);
        isDosActiveRef.current = false;
        addLog(`[System] Test Finished.Total sent: ${currentCount} YAY!`, 'sys');
    };

    const stopDosTest = () => {
        setIsDosActive(false);
        isDosActiveRef.current = false;
        addLog(`[System] Test Aborted by User.`, 'sys');
    };

    const exportLogs = () => {
        const textData = logs.map(l => `[${l.time}][${l.type.toUpperCase()}] ${l.text} `).join('\n');
        const blob = new Blob([textData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thighdos_cute_logs_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        addLog(`[System] Logs exported nicely to file.`, 'sys');
    };

    const currentPercent = stats.total > 0 ? (stats.current / stats.total) * 100 : 0;

    return (
        <>
            <div className="panel" style={{ marginBottom: "20px" }}>
                <h2 style={{ marginTop: 0, borderBottom: "1px solid rgba(255,190,210,0.4)", paddingBottom: "10px", color: "#ff85a2" }}>✧ CONNECTION SETUP ✧</h2>
                <div className="flex-split">
                    <div className="input-group flex-half">
                        <label>Broker IP / URL</label>
                        <input type="text" value={brokerUrl} onChange={(e) => setBrokerUrl(e.target.value)} disabled={status !== 'disconnected'} />
                    </div>
                    <div className="input-group flex-half">
                        <label>Topic Address</label>
                        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={status !== 'disconnected'} />
                    </div>
                </div>
                <div className="flex-row" style={{ marginTop: "10px" }}>
                    <div style={{ fontWeight: 800, color: "#a88bb3" }}>
                        Status: <span style={{ color: status === 'connected' ? '#ff85a2' : status === 'connecting' ? '#ffadad' : '#bfa2c8' }}>{status.toUpperCase()}</span>
                    </div>
                    <div>
                        {status === 'disconnected' ? (
                            <button className="btn" onClick={connectToMqtt}><FaHeart style={{ marginRight: "6px" }} /> CONNECT</button>
                        ) : (
                            <button className="btn btn-stop" onClick={disconnectMqtt}>DISCONNECT</button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-split">
                {/* Chat / Logs Box */}
                <div className="panel flex-half" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="flex-row" style={{ marginBottom: "10px", borderBottom: "1px solid rgba(255,190,210,0.4)", paddingBottom: "5px" }}>
                        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#ff85a2" }}>✧ ACTIVITY LOGS ✧</h2>
                        <button className="btn" style={{ padding: "6px 10px", fontSize: "0.85rem" }} onClick={exportLogs}><FaDownload /> SAVE LOGS</button>
                    </div>

                    <div className="terminal-window">
                        {logs.map((log) => (
                            <p key={log.id} className={log.type === 'sys' ? 'log-sys' : log.type === 'sent' ? 'log-sent' : 'log-recv'}>
                                <span style={{ color: '#bfa2c8', marginRight: "5px" }}>[{log.time}]</span>
                                {log.text}
                            </p>
                        ))}
                        <div ref={logsEndRef}></div>
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                        <label>Say something nice (Manual Chat)</label>
                        <div className="input-row">
                            <input type="text" placeholder="Type here..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()} disabled={status !== 'connected'} />
                            <button className="btn" onClick={sendChatMessage} disabled={status !== 'connected'} style={{ padding: "12px 18px" }}><FaPaperPlane /></button>
                        </div>
                    </div>
                </div>

                {/* DOS BOX */}
                <div className="panel flex-half">
                    <h2 style={{ marginTop: 0, borderBottom: "1px solid rgba(255,190,210,0.4)", paddingBottom: "10px", color: "#ff85a2" }}>✧ CUTE STRESS TEST ENGINE ✧</h2>
                    <div className="flex-split">
                        <div className="input-group flex-half">
                            <label>Requests Amount</label>
                            <input type="number" value={reqAmount} onChange={(e) => setReqAmount(Number(e.target.value))} disabled={isDosActive} />
                        </div>
                        <div className="input-group flex-half">
                            <label>Speed Interval (ms)</label>
                            <input type="number" value={reqInterval} onChange={(e) => setReqInterval(Number(e.target.value))} disabled={isDosActive} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Packet Payload (Data)</label>
                        <input type="text" value={dosPayload} onChange={(e) => setDosPayload(e.target.value)} disabled={isDosActive} />
                    </div>

                    {!isDosActive ? (
                        <button className="btn btn-wide" onClick={startDosTest} disabled={status !== 'connected'}>
                            <FaPlay style={{ marginRight: "10px" }} /> START TEST (◕‿◕)
                        </button>
                    ) : (
                        <button className="btn btn-stop btn-wide" onClick={stopDosTest}>
                            <FaStop style={{ marginRight: "10px" }} /> ABORT TEST (シ_ _)シ
                        </button>
                    )}

                    {/* REQUEST COUNTER ONLY VISIBLE WHEN TEST STARTED OR STATS EXIST */}
                    {(isDosActive || stats.total > 0) && (
                        <div style={{ marginTop: "20px" }}>
                            <div style={{ textAlign: "center", marginBottom: "5px", color: "#a88bb3", fontWeight: 700 }}>
                                TEST PROGRESS: {stats.current} / {stats.total}
                            </div>
                            <div className="progress-container">
                                <div className="progress-bar" style={{ width: `${currentPercent}% ` }}></div>
                            </div>
                            <div className="stats-grid">
                                <div className="stat-box"><div className="title">SENT</div><div className="value success">{stats.current}</div></div>
                                <div className="stat-box"><div className="title">FAILED</div><div className="value fail">{stats.fail}</div></div>
                                <div className="stat-box"><div className="title">PENDING</div><div className="value total">{stats.total - stats.current}</div></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MqttPanel;
