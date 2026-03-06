import styles from "./DosSettings.module.css";
import { useState } from "react";

function DosSettings() {
  const [infToggle, setInfToggle] = useState(true);
  return (
    <>
      <div className={styles.dos}>
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
          <input
            type="checkbox"
            onChange={() => {
              setInfToggle(!infToggle);
            }}
          />
        </div>
        {infToggle && <input type="number" name="" id="" />}
      </div>
      <button>Done</button>
    </>
  );
}

export default DosSettings;
