import "./App.css";

import MqttPanel from "./components/MqttPanel";

function App() {
  return (
    <>
      <div className="header">
        <h1>ThighDOS</h1>
        <p>NETWORK STRESS TESTING SUITE v1.0</p>
      </div>

      <div className="panel" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#ff0000", fontSize: "0.9rem" }}>
          [WARNING] WE ARE NOT LIABLE FOR ACTIONS TAKEN WITH THIS TOOL. AUTHORIZED USE ONLY.
        </span>
      </div>

      <MqttPanel />
    </>
  );
}

export default App;
