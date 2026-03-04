// Functionalitys Imports:
import "./App.css";

// Icon imports:
import MqttPanel from "./components/MqttPanel";

function App() {
  const splash = "Splash Text and stuff";

  return (
    <>
      <div className="header">
        <h1>ThighDOS</h1>
        <p>{splash}</p>
      </div>

      <div className="sketch-box disclaimer" style={{ marginBottom: "20px" }}>
        <span>We (the ThighDOS Developers) are not viable for anything that the user does with this tool.</span>
        <button className="btn">Ok</button>
      </div>

      <button className="btn btn-wide">Create New Requests</button>

      <div className="sketch-box request-panel">
        <MqttPanel />
      </div>
    </>
  );
}

export default App;
