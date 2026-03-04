// Functionalitys Imports:
import "./App.css";
import { useEffect, useState } from "react";

// Icon imports:
import { FaXmark } from "react-icons/fa6";
import MqttPanel from "./components/MqttPanel";

function App() {
  const splash = "Nenn es ThighDOS ~Tobias Rieger 2026";
  const [mqttVisable, setMqttVisable] = useState(false);

  return (
    <>
      <div className="top">
        <h1>ThighDOS</h1>
        <p style={{ fontStyle: "italic" }}>{splash}</p>
      </div>

      <div className="warning" id="warning">
        <p>By using this software you (the user) are liable for any damages!</p>
        <button
          onClick={() => {
            const warning = document.getElementById("warning");
            if (warning) {
              warning.style.display = "none";
            }
          }}
        >
          <FaXmark />
        </button>
      </div>

      <button className="option">New DOS List</button>
      <button
        className="option"
        onClick={() => {
          setMqttVisable(!mqttVisable);
        }}
      >
        Open MQTT Client
      </button>
      {mqttVisable && (
        <div className="mqttContainer">
          <main
            style={{
              maxWidth: "800px",
              margin: "20px auto",
              padding: "0 20px",
            }}
            id="mqtt-chat"
          >
            <MqttPanel />
          </main>
        </div>
      )}
    </>
  );
}

export default App;
