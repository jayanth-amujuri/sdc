import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Particles from './Particles';
import config from './config';
import './SuperdenseCoding.css';

export default function SuperdenseCoding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('00');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [qkdKey, setQkdKey] = useState('');
  const [sdcEve, setSdcEve] = useState(false);
  const [qkdSecure, setQkdSecure] = useState(true); // updated from backend

  useEffect(() => {
    if (location.state) {
      setQkdKey(location.state.qkdKey || '');
      // Accept either sdcEve (explicit) or simulateEve (from QKD page) and default to false
      setSdcEve(location.state.sdcEve ?? location.state.simulateEve ?? false);
      // Prefer explicit qkdSecure, else infer from qber if provided, else default true
      const inferredSecure =
        location.state.qkdSecure ??
        (typeof location.state.qber === 'number' ? location.state.qber < 0.11 : true);
      setQkdSecure(!!inferredSecure);
    }
  }, [location.state]);
  

  const handleSendMessage = async () => {
    if (!qkdSecure) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.application.baseURL}/sdc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pass QKD key and security flag so backend can validate
        body: JSON.stringify({
          message,
          eve: sdcEve,
          qkd_key: qkdKey,
          qkd_secure: qkdSecure
        })
      });
      const data = await response.json();
      if (response.ok) setResults(data);
      else setError(data.error || 'Failed to run superdense coding');
    } catch {
      setError('Network error: Unable to connect to backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToQKD = () => navigate('/qkd-simulation');
  const handleGoToFullSimulation = () => {
    navigate('/full-simulation', {
      state: {
        qkdKey: qkdKey,
        message: message,
        simulateEve: sdcEve
      }
    });
  };

  const histogramData = results?.histogram ? Object.entries(results.histogram).map(([key, value]) => ({ name: key, value })) : [];

  const formatDensityMatrix = (matrix) => {
    if (!matrix) return null;
    return matrix.map(row =>
      row.map(c => {
        let r = 0, i = 0;
        if (typeof c === 'object') { r = Math.round(c.real * 1000) / 1000; i = Math.round(c.imaginary * 1000) / 1000; }
        else if (typeof c === 'number') { r = Math.round(c * 1000) / 1000; i = 0; }
        return `${r}${i >= 0 ? '+' : ''}${i}i`;
      })
    );
  };

  return (
    <>
      <Particles
        particleCount={200} particleSpread={10} speed={0.2}
        particleColors={["#667eea","#764ba2","#f093fb","#22d3ee"]}
        moveParticlesOnHover alphaParticles particleBaseSize={60} sizeRandomness={0.6} cameraDistance={20}
      />

      <div className="sdc-page">
        <motion.div className="sdc-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>

          <header className="sdc-header">
            <motion.h1 className="sdc-title" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
              Superdense Coding with QKD Keys
            </motion.h1>
            <motion.p className="sdc-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
              Encode a 2-bit message using entangled qubits and the secure QKD key.
            </motion.p>
          </header>

          {qkdKey && (
            <motion.div className="qkd-key-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
              <h3>QKD Key</h3>
              <div className="qkd-key-display">{qkdKey.split('').map((b, i) => <span key={i} className="qkd-key-bit">{b}</span>)}</div>
            </motion.div>
          )}

          {!qkdSecure && (
            <motion.div className="error-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ⚠️ QKD key compromised! Regenerate QKD to proceed.
            </motion.div>
          )}

          <motion.div className="controls-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}>
            <div className="control-group">
              <label>Enter 2-bit Message:</label>
              <select value={message} onChange={e => setMessage(e.target.value)} className="control-select">
                <option value="00">00</option>
                <option value="01">01</option>
                <option value="10">10</option>
                <option value="11">11</option>
              </select>
            </div>
            <div className="control-group">
              <label>Eve during SDC:</label>
              <span className="eve-status">{sdcEve ? 'Yes' : 'No'}</span>
            </div>
            <button className="send-message-button" onClick={handleSendMessage} disabled={isLoading || !qkdSecure}>
              {isLoading ? 'Sending...' : (!qkdSecure ? 'QKD Key Compromised!' : 'Send Message')}
            </button>
          </motion.div>

          {error && <motion.div className="error-message" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>❌ {error}</motion.div>}

          {results && (
            <motion.div className="results-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h2>Superdense Coding Results</h2>

              <div className="encrypted-section">
                <h3>Encrypted Message</h3>
                <div className="message-display">{results.encrypted_message?.map((b, i) => <span key={i} className="message-bit encrypted">{b}</span>)}</div>
              </div>

              <div className="status-section">
                <div className="status-card">
                  <h4>Entanglement Status</h4>
                  <p>{results.entanglement_status}</p>
                </div>
                <div className="status-card">
                  <h4>Communication Status</h4>
                  <p>{results.communication_status}</p>
                </div>
              </div>

              {results.circuit && (
                <div className="circuit-section">
                  <h3>Quantum Circuit</h3>
                  <img src={`data:image/png;base64,${results.circuit}`} alt="Circuit" className="circuit-image" />
                </div>
              )}

              {histogramData.length > 0 && (
                <div className="histogram-section">
                  <h3>Measurement Histogram</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={histogramData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#667eea" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {results.bloch_spheres?.length > 0 && (
                <div className="bloch-section">
                  <h3>Bloch Spheres</h3>
                  <div className="bloch-gallery">{results.bloch_spheres.map((b, i) => <div key={i} className="bloch-item"><img src={`data:image/png;base64,${b}`} alt={`Qubit ${i + 1}`} /><p>Qubit {i + 1}</p></div>)}</div>
                </div>
              )}

              {results.density_matrix && (
                <div className="density-section">
                  <h3>Density Matrix</h3>
                  <table className="density-table">
                    <tbody>{formatDensityMatrix(results.density_matrix)?.map((row, rI) => <tr key={rI}>{row.map((el, cI) => <td key={cI}>{el}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          <div className="navigation-section">
            {results ? (
              <button onClick={handleGoToFullSimulation} className="proceed-button">Full Simulation →</button>
            ) : (
              <button onClick={handleBackToQKD} className="back-button">← Back to QKD</button>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
