// Functionalitys Imports:
import "./App.css";
import { useState } from "react";
import DosSettings from "./components/DosSettings";

// Icon imports:
import { FaXmark } from "react-icons/fa6";
import MqttPanel from "./components/MqttPanel";

function App() {
  const splash = "Nenn es ThighDOS ~Tobias Rieger 2026";
  const [mqttVisable, setMqttVisable] = useState(false);
  const [dosSettingsVisable, setDosSettingsVisable] = useState(true);

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

      <button
        className="option"
        onClick={() => {
          setDosSettingsVisable(!dosSettingsVisable);
        }}
      >
        New DOS List
      </button>

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

      {dosSettingsVisable && (
        <div
          className="dosSettings"
          style={{
            position: "absolute",
            width: "700px",
            height: "500px",
            maxHeight: "80%",
            margin: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#fff",
            borderStyle: "solid",
            borderRadius: "20px",
            borderWidth: "5px",
            filter: "drop-shadow(0 0 20px #ffc6ff)",
          }}
        >
          <DosSettings />
          <button
            onClick={() => {
              setDosSettingsVisable(!dosSettingsVisable);
            }}
          >
            Back
          </button>
        </div>
      )}
    </>
  );
}

export default App;
