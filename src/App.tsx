// Functionalitys Imports:
import "./App.css";

// Icon imports:
import { FaXmark } from "react-icons/fa6";
import MqttPanel from "./components/MqttPanel";

function App() {
  const splash = "Nenn es ThighDOS ~Tobias Rieger 2026";
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
            const warning: any = document.getElementById("warning");
            if (warning) {
              warning.style.display = "none";
            }
          }}
        >
          <FaXmark />
        </button>
      </div>

      <button>New DOS List</button>
      <button
        onClick={() => {
          const mqttChat = document.getElementById("mqtt-chat");
          if (mqttChat) {
            mqttChat.style.display = "none";
          }
        }}
      >
        Open MQTT Client
      </button>

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
    </>
  );
}

export default App;
