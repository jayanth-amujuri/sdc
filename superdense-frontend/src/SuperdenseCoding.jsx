// SuperdenseCoding.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Particles from './Particles';
import HoloToggle from './HoloToggle';
import MagicBento from './MagicBento';
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
  const [qkdSecure, setQkdSecure] = useState(true);

  useEffect(() => {
    if (location.state) {
      setQkdKey(location.state.qkdKey || '');
      setSdcEve(location.state.sdcEve ?? location.state.simulateEve ?? false);
      const inferredSecure =
        location.state.qkdSecure ??
        (typeof location.state.qber === 'number' ? location.state.qber < 0.11 : true);
      setQkdSecure(!!inferredSecure);
    }
  }, [location.state]);

  useEffect(() => {
    if (!qkdSecure || !qkdKey) return;
    if (results !== null && !isLoading) {
      handleSendMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdcEve]);

  const handleSendMessage = async () => {
    if (!qkdSecure) return;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${config.application.baseURL}/sdc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          eve: sdcEve,
          qkd_key: qkdKey,
          qkd_secure: qkdSecure
        })
      });
      const data = await resp.json();
      if (resp.ok) setResults(data);
      else setError(data.error || 'Failed to run superdense coding');
    } catch (e) {
      setError('Network error: Unable to connect to backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToQKD = () => navigate('/qkd-simulation');
  const handleGoToFullSimulation = () => {
    navigate('/full-simulation', { state: { qkdKey, message, simulateEve: sdcEve } });
  };

  const histogramData = results?.histogram
    ? Object.entries(results.histogram)
        .map(([key, value]) => ({
          name: String(key).trim().padStart(2, '0'),
          value
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const formatDensityMatrix = (matrix) => {
    if (!matrix) return null;
    return matrix.map((row) =>
      row.map((c) => {
        let r = 0,
          i = 0;
        if (typeof c === 'object') {
          r = Math.round(c.real * 1000) / 1000;
          i = Math.round(c.imaginary * 1000) / 1000;
        } else if (typeof c === 'number') {
          r = Math.round(c * 1000) / 1000;
          i = 0;
        }
        return `${r}${i >= 0 ? '+' : ''}${i}i`;
      })
    );
  };

  return (
    <>
      <Particles
        particleCount={200}
        particleSpread={10}
        speed={0.2}
        particleColors={['#667eea', '#764ba2', '#f093fb', '#22d3ee']}
        moveParticlesOnHover
        alphaParticles
        particleBaseSize={60}
        sizeRandomness={0.6}
        cameraDistance={20}
      />

      <div className="sdc-page">
        <motion.div
          className="sdc-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <header className="sdc-header">
            <motion.h1
              className="sdc-title"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Superdense Coding with QKD Keys
            </motion.h1>
            <motion.p
              className="sdc-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Encode a 2-bit message using entangled qubits and the secure QKD key.
            </motion.p>
          </header>

          {/* Section 1: Security (QKD) */}
          <div className="sdc-main-section">
            <h2 className="section-title">Security: QKD</h2>
            <p className="section-subtitle">Key Distribution Summary</p>
            {qkdKey ? (
              <div className="qkd-key-display">
                {qkdKey.split('').map((b, i) => (
                  <span key={i} className="qkd-key-bit">{b}</span>
                ))}
              </div>
            ) : <p className="info-text">No QKD key found. Please run QKD first.</p>}
            {!qkdSecure && (
              <div className="error-message">
                ⚠ QKD key compromised! Regenerate QKD to proceed.
              </div>
            )}
          </div>
          
          {/* Section 2: Protocol (SDC) - EVE TOGGLE MOVED HERE */}
          <div className="sdc-main-section">
            <h2 className="section-title">Protocol: SDC</h2>
            <p className="section-subtitle">Superdense Coding Flow</p>
            <div className="control-group">
              <label>Select 2-bit Message:</label>
              <select value={message} onChange={(e) => setMessage(e.target.value)} className="control-select">
                <option value="00">00</option>
                <option value="01">01</option>
                <option value="10">10</option>
                <option value="11">11</option>
              </select>
            </div>
            <div className="control-group">
              <label>Simulate Eavesdropper (Eve):</label>
              <HoloToggle checked={sdcEve} onChange={setSdcEve} labelOn="Active" labelOff="Inactive" />
            </div>
             {sdcEve && (
              <div className="eve-persistent-banner">
                ⚠ Eve is active! Communication may be compromised.
              </div>
            )}
          </div>
          
          {/* Analysis and Visualization Sections (Rendered on results) */}
          {results && (
            <>
              <div className="sdc-main-section">
                <h2 className="section-title">Analysis: Results</h2>
                <p className="section-subtitle">Measurements & Stats</p>
                
                <div className={`${sdcEve ? 'warning-banner' : 'success-banner'}`}>
                  {sdcEve ? '⚠ Eve has interfered! Message may be corrupted.' : '✅ Entanglement successful. Message delivered securely.'}
                </div>

                <div className="encrypted-section">
                  <h3>Encrypted Message (XOR with Key)</h3>
                  <div className="message-display">
                    {results.encrypted_message?.map((b, i) => (
                      <span key={i} className="message-bit encrypted">{b}</span>
                    ))}
                  </div>
                </div>

                <div className="status-section">
                    <div className={`status-card ${sdcEve ? 'warning-card' : 'success-card'}`}>
                        <h4>Entanglement Status</h4>
                        <p className={`status-text ${sdcEve ? 'warning' : 'success'}`}>{sdcEve ? '❌ Entanglement broken' : '✅ Established'}</p>
                    </div>
                    <div className={`status-card ${sdcEve ? 'warning-card' : 'success-card'}`}>
                        <h4>Communication Status</h4>
                        <p className={`status-text ${sdcEve ? 'warning' : 'success'}`}>{sdcEve ? '⚠ Garbled' : '✅ Secure'}</p>
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
                    <h3>Measurement Histogram {sdcEve ? '(With Tampering)' : ''}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={histogramData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill={sdcEve ? '#ef4444' : '#22c55e'} label={{ position: 'top' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {results.density_matrix && (
                  <div className="density-section">
                    <h3>Density Matrix</h3>
                    <table className="density-table">
                      <tbody>
                        {formatDensityMatrix(results.density_matrix)?.map((row, rI) => (
                          <tr key={rI}>{row.map((el, cI) => <td key={cI}>{el}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="sdc-main-section">
                 <h2 className="section-title">Viz: Bloch</h2>
                 <p className="section-subtitle">State Visualization</p>
                 {(() => {
                    const blochImages = Array.isArray(results.bloch_spheres) ? results.bloch_spheres.flatMap(item => typeof item === 'string' ? [item] : []) : [];
                    return blochImages.length > 0 ? (
                      <div className="bloch-gallery">
                        {blochImages.map((b64, i) => (
                          <div key={`${message}-${sdcEve}-${i}`} className="bloch-item">
                            <img src={`data:image/png;base64,${b64}`} alt={`Qubit ${i}`} style={{ width: '100%', height: 'auto' }} />
                            <p>Qubit {i}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="info-text">No Bloch sphere visualizations available.</p>;
                  })()}
              </div>
            </>
          )}
          
          {error && (
            <motion.div className="error-message" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              ❌ {error}
            </motion.div>
          )}

          {/* Section 3: Action (Run) */}
          <div className="sdc-main-section">
             <h2 className="section-title">Action: Run</h2>
             <p className="section-subtitle">Full Simulation</p>
            <button className="send-message-button" onClick={handleSendMessage} disabled={isLoading || !qkdSecure}>
              {isLoading ? 'Sending...' : 'Run Superdense Coding'}
            </button>
            <div className="navigation-section">
              {results ? (
                <button onClick={handleGoToFullSimulation} className="proceed-button">
                  View Full Simulation →
                </button>
              ) : (
                <button onClick={handleBackToQKD} className="back-button">
                  ← Back to QKD
                </button>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </>
  );
}