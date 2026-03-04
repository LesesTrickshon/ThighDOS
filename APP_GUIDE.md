# ThighDOS Desktop App - Benutzerhandbuch

Willkommen bei der **ThighDOS** Desktop-App! Diese Anwendung kombiniert ein modernes React-Frontend mit einem extrem schnellen und ressourcenschonenden Rust-Backend über das **Tauri**-Framework. Außerdem haben wir eine Echtzeit-MQTT-Integration für Chats und Steuerung eingebaut.

Hier erfährst du, wie du das Projekt startest, entwickelst und als fertige App (.app / .exe) baust.

---

## 🚀 1. Voraussetzungen

Bevor du startest, stelle sicher, dass folgende Software auf deinem System installiert ist:

1. **Node.js & npm** (Für das Frontend)
   - Lade Node.js von der [offiziellen Website](https://nodejs.org/) herunter.
2. **Rust & Cargo** (Für das Backend)
   - Öffne dein Terminal und führe diesen Befehl aus: 
     `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
3. **Erforderliche System-Abhängigkeiten** 
   - **Mac-Nutzer (WICHTIG):** Du musst die Xcode Command Line Tools installieren! Führe aus: `xcode-select --install`
   - Linux/Windows-Nutzer finden die Liste [hier bei Tauri](https://tauri.app/v1/guides/getting-started/prerequisites).

---

## 🛠️ 2. Die App lokal starten (Development Mode)

Wenn du an der App arbeiten möchtest oder sie einfach testen willst, nutzt du den Development-Modus. Dieser startet das React-Frontend mit Hot-Reloading (Änderungen im Code sind sofort sichtbar) und verpackt es in das Rust-Desktop-Fenster.

1. Öffne das Terminal im Projektordner (`ThighDOS`).
2. **(Zuerst!)** Installiere alle benötigten Code-Pakete:
   ```bash
   npm install
   ```
3. Führe folgenden Befehl aus, um die App zu starten:
   ```bash
   npx tauri dev
   ```
*Hinweis: Beim allerersten Start kann dies einen Moment dauern, da Rust alle Abhängigkeiten (Crates) herunterladen und kompilieren muss.*

---

## 📦 3. Die fertige Desktop-App bauen (Release)

Möchtest du die App an Freunde weitergeben oder normal auf deinem Computer installieren? Dann musst du einen "Release Build" erstellen. Dies erzeugt (je nach deinem Betriebssystem) eine `.app` (Mac), eine `.exe` (Windows) oder eine `.deb` (Linux).

1. Öffne das Terminal im Projektordner.
2. Führe diesen Befehl aus:
   ```bash
   npx tauri build
   ```
Das gebaute Programm (Installer sowie die eigentliche App) findest du anschließend unter:
`src-tauri/target/release/bundle/`

---

## 💬 4. Die MQTT Chat-Funktion nutzen

Die App verfügt über ein MQTT-Panel. Um dieses nutzen zu können, musst du dich mit dem Broker verbinden:

1. **IP und Topic**: Die IP-Adresse des Brokers und der Standard-Raum (Topic) werden automatisch aus der `.env`-Datei geladen. 
 *(Falls du die IP ändern musst, bearbeite die `.env` im Hauptordner: `VITE_MQTT_BROKER_URL=ws://DEINE_IP:9001`)*
2. **WebSockets (Wichtig!)**: Da die App ein Web-Frontend nutzt, verbindet sie sich über **WebSockets (ws://)** mit dem MQTT-Broker. Standardmäßig passiert das über den **Port 9001**.
 *Stelle sicher, dass der MQTT-Broker (Mosquitto/Tasmota) für WebSockets auf Port 9001 konfiguriert ist!*
3. **Verbinden & Chatten**: Klicke in der App auf "Connect". Wenn "Status: CONNECTED" grün aufleuchtet, bist du im Raum und kannst Nachrichten senden. Dein Freund muss genau denselben Raum-Namen (Topic) eingeben.

---

## 🔒 5. Sicherheitshinweis

Vermeide es, sensible Daten wie private IP-Adressen oder Passwörter direkt in den Quellcode zu schreiben. Nutze stattdessen immer die `.env`-Datei. Diese Datei wird von Git ignoriert und landet niemals öffentlich auf GitHub. Eine Vorlage dazu findest du in der `.env.example`.
