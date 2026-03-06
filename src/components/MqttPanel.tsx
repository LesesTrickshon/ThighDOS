import React, { useState, useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { FaPlay, FaStop, FaDownload, FaPaperPlane, FaHeart, FaMicrochip } from 'react-icons/fa';

interface LogEntry {
    id: number;
    type: 'sent' | 'recv' | 'sys';
    text: string;
    time: string;
}

interface DiscoveryDevice {
    device_id: string;
    config: any;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MqttPanel: React.FC = () => {
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

    // Connection State
    const [brokerIp, setBrokerIp] = useState('172.30.148.28');
    const [brokerPort, setBrokerPort] = useState(1883);
    const [topic, setTopic] = useState('ThighDOS/Chat');

    // Discovery
    const [discoveredDevices, setDiscoveredDevices] = useState<Record<string, DiscoveryDevice>>({});

    // DOS & Stats
    const [isDosActive, setIsDosActive] = useState(false);
    const [reqAmount, setReqAmount] = useState(100);
    const [reqInterval, setReqInterval] = useState(10);
    const [dosPayload, setDosPayload] = useState('{"msg": "kawaii_test ~"}');
    const [stats, setStats] = useState({ current: 0, total: 100, success: 0, fail: 0 });
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
            const limit = 200;
            if (newLogs.length > limit) return newLogs.slice(-limit);
            return newLogs;
        });
    };

    useEffect(() => {
        // Auto-scroll logs
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    useEffect(() => {
        const setupListeners = async () => {
            const unlistenMsg = await listen('mqtt-message', (event: any) => {
                const { topic: msgTopic, payload } = event.payload;
                if (!isDosActiveRef.current || Math.random() < 0.05) {
                    addLog(`[${msgTopic}] IN: ${payload}`, 'recv');
                }
            });

            const unlistenDiscovery = await listen('mqtt-discovery', (event: any) => {
                const device = event.payload as DiscoveryDevice;
                setDiscoveredDevices(prev => ({
                    ...prev,
                    [device.device_id]: device
                }));
                addLog(`✨ Discovered Device: ${device.device_id}`, 'sys');
            });

            const unlistenError = await listen('mqtt-error', (event: any) => {
                addLog(`MQTT Error: ${event.payload}`, 'sys');
                setStatus('disconnected');
            });

            return () => {
                unlistenMsg();
                unlistenDiscovery();
                unlistenError();
            };
        };

        const cleanup = setupListeners();
        return () => {
            cleanup.then(fn => fn());
        };
    }, []);

    const connectToMqtt = async () => {
        setStatus('connecting');
        addLog(`Connecting via Rust Backend to ${brokerIp}:${brokerPort}...`, 'sys');
        try {
            await invoke('connect_mqtt', { brokerUrl: brokerIp, port: brokerPort });
            setStatus('connected');
            addLog(`Connected! Discovery active (listening to everything).`, 'sys');
            // Auto-trigger fallback discovery by asking all tasmota devices for status!
            await invoke('publish_mqtt', { topic: "cmnd/tasmotas/status0", payload: "" });
        } catch (e: any) {
            setStatus('disconnected');
            addLog(`Failed to connect: ${e}`, 'sys');
        }
    };

    const wakeUpDevices = async () => {
        if (status !== 'connected') return;
        addLog(`[System] Sending 'status0' broadcast to all Tasmota devices...`, 'sys');
        await invoke('publish_mqtt', { topic: "cmnd/tasmotas/status0", payload: "" });
    };

    const disconnectMqtt = () => {
        // In a real app, we'd invoke a 'disconnect' command, but for now we just reset state
        setStatus('disconnected');
        addLog(`Disconnected by user.`, 'sys');
        setIsDosActive(false);
        isDosActiveRef.current = false;
    };

    const sendChatMessage = async () => {
        if (status !== 'connected' || !chatInput.trim()) return;
        try {
            await invoke('publish_mqtt', { topic, payload: chatInput });
            addLog(`OUT => ${chatInput}`, 'sent');
            setChatInput('');
        } catch (e: any) {
            addLog(`Send Error: ${e}`, 'sys');
        }
    };

    const startDosTest = async () => {
        if (status !== 'connected') {
            addLog("Cannot start Test: No MQTT connection. :(", 'sys');
            return;
        }

        setIsDosActive(true);
        isDosActiveRef.current = true;
        setStats({ current: 0, total: reqAmount, success: 0, fail: 0 });
        addLog(`[System] Initializing Stress Test sequence on ${topic}...`, 'sys');

        let currentCount = 0;
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < reqAmount; i++) {
            if (!isDosActiveRef.current) break;

            try {
                await invoke('publish_mqtt', { topic, payload: dosPayload });
                successCount++;
            } catch (e) {
                failCount++;
            }
            currentCount++;

            if (reqInterval > 100 || currentCount % 10 === 0) {
                setStats({ current: currentCount, total: reqAmount, success: successCount, fail: failCount });
            }

            if (reqInterval > 0) {
                await sleep(reqInterval);
            }
        }

        setStats({ current: currentCount, total: reqAmount, success: successCount, fail: failCount });
        setIsDosActive(false);
        isDosActiveRef.current = false;
        addLog(`[System] Sequence Finished. Total sent: ${currentCount}`, 'sys');
    };

    const stopDosTest = () => {
        setIsDosActive(false);
        isDosActiveRef.current = false;
        addLog(`[System] Sequence Aborted by User.`, 'sys');
    };

    const exportLogs = () => {
        const textData = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
        const blob = new Blob([textData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thighdos_logs_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const currentPercent = stats.total > 0 ? (stats.current / stats.total) * 100 : 0;

    return (
        <>
            <div className="panel" style={{ marginBottom: "20px" }}>
                <h2 style={{ marginTop: 0, borderBottom: "1px solid rgba(255,190,210,0.4)", paddingBottom: "10px", color: "#ff85a2" }}>✧ CONNECTION SETUP (RUST BACKEND) ✧</h2>
                <div className="flex-split" style={{ marginBottom: "10px" }}>
                    <div className="input-group">
                        <label>Broker IP</label>
                        <input type="text" value={brokerIp} onChange={(e) => setBrokerIp(e.target.value)} disabled={status !== 'disconnected'} />
                    </div>
                    <div className="input-group" style={{ marginLeft: "10px" }}>
                        <label>Port</label>
                        <input type="number" value={brokerPort} onChange={(e) => setBrokerPort(Number(e.target.value))} disabled={status !== 'disconnected'} />
                    </div>
                </div>
                <div className="input-group">
                    <label>Target / Chat Topic</label>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. ThighDOS/Chat or cmnd/HHS/status" />
                </div>

                <div className="flex-row" style={{ marginTop: "15px" }}>
                    <div style={{ fontWeight: 800, color: "#a88bb3" }}>
                        Status: <span style={{ color: status === 'connected' ? '#ff85a2' : '#bfa2c8' }}>{status.toUpperCase()}</span>
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

            {/* Discovery Section */}
            {(Object.keys(discoveredDevices).length > 0 || status === 'connected') && (
                <div className="panel" style={{ marginBottom: "20px" }}>
                    <div className="flex-row" style={{ marginBottom: "10px" }}>
                        <h2 style={{ margin: 0, color: "#ff85a2", fontSize: "1rem" }}>✨ DISCOVERED TASMOTA DEVICES</h2>
                        <button className="btn" style={{ fontSize: "0.75rem", padding: "4px 8px" }} onClick={wakeUpDevices}>Scan / Wake Up</button>
                    </div>
                    {Object.keys(discoveredDevices).length === 0 ? (
                        <div style={{ color: '#bfa2c8', fontSize: '0.85rem' }}>Listening for devices... Click Scan if empty.</div>
                    ) : (
                        <div className="stats-grid">
                            {Object.values(discoveredDevices).map(device => (
                                <div key={device.device_id} className="stat-box" style={{ cursor: 'pointer' }} onClick={() => setTopic(`cmnd/${device.device_id}/status`)}>
                                    <div className="title"><FaMicrochip /> DEVICE</div>
                                    <div className="value success" style={{ fontSize: '0.9rem' }}>{device.device_id}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#a88bb3' }}>Click to Command</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}



            <div className="flex-split">
                <div className="panel flex-half" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="flex-row" style={{ marginBottom: "10px", borderBottom: "1px solid rgba(255,190,210,0.4)", paddingBottom: "5px" }}>
                        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#ff85a2" }}>✧ MQTT TRAFFIC ✧</h2>
                        <button className="btn" style={{ padding: "6px 10px", fontSize: "0.85rem" }} onClick={exportLogs}><FaDownload /> SAVE</button>
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
                        <label>Publish to target Topic ({topic}):</label>
                        <div className="input-row">
                            <input type="text" placeholder="Send value / command..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()} disabled={status !== 'connected'} />
                            <button className="btn" onClick={sendChatMessage} disabled={status !== 'connected'} style={{ padding: "12px 18px" }}><FaPaperPlane /></button>
                        </div>
                    </div>
                </div>

                <div className="panel flex-half">
                    <h2 style={{ marginTop: 0, borderBottom: "1px solid rgba(255,190,210,0.4)", paddingBottom: "10px", color: "#ff85a2" }}>✧ COMMAND ENGINE ✧</h2>
                    <div className="flex-split">
                        <div className="input-group flex-half">
                            <label>Packets</label>
                            <input type="number" value={reqAmount} onChange={(e) => setReqAmount(Number(e.target.value))} disabled={isDosActive} />
                        </div>
                        <div className="input-group flex-half">
                            <label>Interval (ms)</label>
                            <input type="number" value={reqInterval} onChange={(e) => setReqInterval(Number(e.target.value))} disabled={isDosActive} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Custom Payload</label>
                        <input type="text" value={dosPayload} onChange={(e) => setDosPayload(e.target.value)} disabled={isDosActive} />
                    </div>

                    {!isDosActive ? (
                        <button className="btn btn-wide" onClick={startDosTest} disabled={status !== 'connected'}>
                            <FaPlay style={{ marginRight: "10px" }} /> EXECUTE SEQUENCE
                        </button>
                    ) : (
                        <button className="btn btn-stop btn-wide" onClick={stopDosTest}>
                            <FaStop style={{ marginRight: "10px" }} /> ABORT
                        </button>
                    )}

                    {(isDosActive || stats.current > 0) && (
                        <div style={{ marginTop: "20px" }}>
                            <div style={{ textAlign: "center", marginBottom: "5px", color: "#a88bb3", fontWeight: 700 }}>
                                PROGRESS: {stats.current} / {stats.total}
                            </div>
                            <div className="progress-container">
                                <div className="progress-bar" style={{ width: `${currentPercent}%` }}></div>
                            </div>
                            <div className="stats-grid">
                                <div className="stat-box"><div className="title">SENT</div><div className="value success">{stats.current}</div></div>
                                <div className="stat-box"><div className="title">FAIL</div><div className="value fail">{stats.fail}</div></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MqttPanel;
