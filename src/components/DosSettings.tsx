import "./DosSettings.css";

function DosSettings() {
  return (
    <div>
      <h1>DOS Settings</h1>
      <h2>Address:</h2>
      <input type="text" placeholder="127.0.0.1" id="" />
      <h2>Amount of Requests:</h2>
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <h3>Dont run Inf:</h3>
        <input type="checkbox" />
      </div>
      <input type="number" name="" id="" />
    </div>
  );
}

export default DosSettings;
