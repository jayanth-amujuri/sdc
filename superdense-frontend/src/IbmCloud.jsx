// src/IbmCloud.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./IbmCloud.css";

export default function IbmCloud() {
  const location = useLocation();
  const [latitude, setLatitude] = useState("33.89729");
  const [longitude, setLongitude] = useState("74.24314");
  const [restrictedStatus, setRestrictedStatus] = useState("0");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [roundProgress, setRoundProgress] = useState([]);
  const [error, setError] = useState(null);

  // Receive predicted lat, lon, restricted status from AircraftNavigation
  useEffect(() => {
    if (location.state) {
      setLatitude(location.state.latitude?.toString() || "33.89729");
      setLongitude(location.state.longitude?.toString() || "74.24314");
      setRestrictedStatus(location.state.restrictedStatus === "Yes" ? "1" : "0");
    }
  }, [location.state]);

  const handleSend = () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRoundProgress([]);

    try {
      // Use GET-based SSE for real-time updates
      const url = `http://localhost:5003/sdc/send-stream?latitude=${latitude}&longitude=${longitude}&restricted_status=${restrictedStatus}`;
      const source = new EventSource(url);

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.completed) {
            setResult(data);
            setLoading(false);
            source.close();
          } else {
            setRoundProgress((prev) => [...prev, data]);
          }
        } catch (err) {
          console.error("Error parsing SSE data:", err);
        }
      };

      source.onerror = (err) => {
        console.error("SSE error:", err);
        setError("Connection lost. Please try again.");
        setLoading(false);
        source.close();
      };
    } catch (err) {
      setError(err.message || "Request failed");
      setLoading(false);
    }
  };

  return (
    <div className="ibm-cloud-page">
      <h1>Superdense Coding - IBM Cloud Interface</h1>

      <div className="sdc-form">
        <div className="display-field">
          <label>Latitude:</label>
          <span>{latitude}</span>
        </div>

        <div className="display-field">
          <label>Longitude:</label>
          <span>{longitude}</span>
        </div>

        <div className="display-field">
          <label>Restricted Status:</label>
          <span>{restrictedStatus === "1" ? "Yes" : "No"}</span>
        </div>

        <button className="send-btn" onClick={handleSend} disabled={loading}>
          {loading ? "Processing..." : "Perform Superdense Coding"}
        </button>
      </div>

      {/* Real-time progress */}
      {roundProgress.length > 0 && (
        <div className="progress-section">
          <h3>Progress</h3>
          <ul>
            {roundProgress.map((r) => (
              <li key={r.round}>
                Round {r.round}: Sent {r.sent} → Measured {r.measured} ({r.message})
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <div className="error">❌ Error: {error}</div>}

      {/* Final results */}
      {result && (
        <div className="sdc-result">
          <h2>SDC Transmission Results</h2>
          <p><b>Original Text:</b> {result.original_text}</p>
          <p><b>Decoded Text:</b> {result.decoded_text}</p>
          <p><b>Success:</b> {result.success ? "✅ Yes" : "⚠️ No"}</p>

          <h3>First Two SDC Circuits (ASCII)</h3>
          {result.first_two_circuits.map((c, idx) => (
            <pre key={idx} className="circuit-ascii">{c}</pre>
          ))}

          <h3>First Few Rounds Summary</h3>
          <table className="rounds-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Sent</th>
                <th>Measured</th>
              </tr>
            </thead>
            <tbody>
              {result.round_summaries.slice(0, 5).map((r) => (
                <tr key={r.round}>
                  <td>{r.round}</td>
                  <td>{r.sent}</td>
                  <td>{r.measured}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
