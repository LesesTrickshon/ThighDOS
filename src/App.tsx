import "./App.css";

import MqttPanel from "./components/MqttPanel";

function App() {
  return (
    <>
      <div className="header">
        <h1>ThighDOS ♡</h1>
        <p>⋆｡°✩ cute network tool ✩°｡⋆</p>
      </div>

      <div className="warning-panel" style={{ marginBottom: "20px" }}>
        <span>
          ⚠️ Please use this super cute tool responsibly! We are not liable for any actions taken. Authorized use only! (´｡• ω •｡`)
        </span>
      </div>

      <MqttPanel />
    </>
  );
}

export default App;
