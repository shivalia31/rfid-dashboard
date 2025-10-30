import React, { useState, useEffect } from "react";
import "./App.css";

const HEARTBEAT_THRESHOLD_MS = 10 * 60 * 1000; 

function useNowTicker(interval = 60_000) {

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), interval);
    return () => clearInterval(id);
  }, [interval]);
}

function DevicesTab({ devices }) {
  return (
    <div className="panel">
      <h2>Devices</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Location</th>
            <th>Last seen</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => {
            const lastSeen = d.last_seen ? new Date(d.last_seen) : null;
            const offline = !lastSeen || Date.now() - lastSeen.getTime() > HEARTBEAT_THRESHOLD_MS;
            return (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.name}</td>
                <td>{d.location}</td>
                <td>{lastSeen ? lastSeen.toLocaleString() : "—"}</td>
                <td className={offline ? "status-offline" : "status-active"}>
                  {offline ? "🔴 Offline" : "🟢 Active"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScansTab({ scans, deviceFilter, setDeviceFilter }) {
  return (
    <div className="panel">
      <h2>Data Management (Scans)</h2>

      <div className="controls">
        <label>
          Filter Device:
          <input
            placeholder="Device ID (e.g. RFID01)"
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
          />
        </label>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Device</th>
            <th>Tag</th>
            <th>Timestamp</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((s, i) => (
            <tr key={s.id ?? i}>
              <td>{s.device_id}</td>
              <td>{s.tag_id}</td>
              <td>{new Date(s.timestamp).toLocaleString()}</td>
              <td>{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertsTab({ devices }) {
  const alerts = devices.filter((d) => {
    const lastSeen = d.last_seen ? new Date(d.last_seen) : null;
    return !lastSeen || Date.now() - lastSeen.getTime() > HEARTBEAT_THRESHOLD_MS;
  });

  return (
    <div className="panel">
      <h2>Alerts</h2>
      {alerts.length === 0 ? (
        <div className="ok">No alerts — all devices are active ✅</div>
      ) : (
        <div>
          {alerts.map((d) => (
            <div key={d.id} className="alert-row">
              ⚠️ <strong>{d.name || d.id}</strong> — last seen:{" "}
              {d.last_seen ? new Date(d.last_seen).toLocaleString() : "never"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("devices");
  const [devices, setDevices] = useState([]);
  const [scans, setScans] = useState([]);
  const [deviceFilter, setDeviceFilter] = useState("");

  useNowTicker(30_000);

  useEffect(() => {
  async function load() {
    try {
      const devicesRes = await fetch("/api/GetDevices");
      if (!devicesRes.ok) throw new Error(`Devices API ${devicesRes.status}`);
      const devicesJson = await devicesRes.json();
      setDevices(Array.isArray(devicesJson) ? devicesJson : (devicesJson.value || devicesJson.documents || []));

      const scansRes = await fetch("/api/GetScans");
      if (!scansRes.ok) throw new Error(`Scans API ${scansRes.status}`);
      const scansJson = await scansRes.json();
      setScans(Array.isArray(scansJson) ? scansJson : (scansJson.value || scansJson.documents || []));
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }
  load();
}, []);


  const visibleScans = deviceFilter
    ? scans.filter((s) => (s.device_id || "").toLowerCase().includes(deviceFilter.toLowerCase()))
    : scans;

  return (
    <div className="App">
      <header>
        <h1>RFID Monitoring Dashboard</h1>
        <div className="subtitle">Prototype — Cosmos DB + Static Web App</div>
      </header>

      <nav className="tabs">
        <button className={tab === "devices" ? "active" : ""} onClick={() => setTab("devices")}>Devices</button>
        <button className={tab === "scans" ? "active" : ""} onClick={() => setTab("scans")}>Data Management</button>
        <button className={tab === "alerts" ? "active" : ""} onClick={() => setTab("alerts")}>Alerts</button>
      </nav>

      <main>
        {tab === "devices" && <DevicesTab devices={devices} />}
        {tab === "scans" && <ScansTab scans={visibleScans} deviceFilter={deviceFilter} setDeviceFilter={setDeviceFilter} />}
        {tab === "alerts" && <AlertsTab devices={devices} />}
      </main>

       </div>
  );
}

export default App;
