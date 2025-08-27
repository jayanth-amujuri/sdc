import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Particles from './Particles';
import config from './config';
import './QKDSimulation.css';

export default function QKDSimulation() {
  const navigate = useNavigate();
  const [numQubits, setNumQubits] = useState(50);
  const [simulateEve, setSimulateEve] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runQKD = async (eveFlag) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const response = await fetch(`${config.application.baseURL}/qkd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_qubits: numQubits, eve: eveFlag }),
      });
      const data = await response.json();
      if (response.ok) {
        setResults(data);
        if (!data.secure) {
          setError('⚠️ QKD key compromised! Eve is present. Generate another key to proceed.');
        }
      } else {
        setError(data.error || 'Failed to run QKD simulation');
      }
    } catch {
      setError('Network error: Unable to connect to backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunQKD = async () => runQKD(simulateEve);

  const handleGenerateSecureKey = async () => {
    // Force a secure regeneration with Eve disabled
    setSimulateEve(false);
    await runQKD(false);
  };

  const handleProceedToSuperdense = () => {
    if (results) {
      navigate('/superdense-coding', { 
        state: { 
          qkdKey: results.qkd_key,
          qkdSecure: results.qber < 0.11, // mark secure if QBER < 11%
          sdcEve: simulateEve // whether Eve will attack in SDC
        } 
      });
    }
  };
  

  const handleBackToHome = () => navigate('/home');

  const histogramData = results?.sifted_bits?.reduce((acc, [aliceBit, bobBit]) => {
    const key = aliceBit === bobBit ? 'Matching' : 'Non-matching';
    const existing = acc.find(item => item.name === key);
    if (existing) existing.value += 1;
    else acc.push({ name: key, value: 1 });
    return acc;
  }, []) || [];

  const blochPairs = results?.bloch_spheres?.slice(0, 2) || [];

  return (
    <>
      <Particles 
        particleCount={200}
        particleSpread={10}
        speed={0.2}
        particleColors={["#667eea", "#764ba2", "#f093fb", "#22d3ee"]}
        moveParticlesOnHover
        particleHoverFactor={2}
        alphaParticles
        particleBaseSize={60}
        sizeRandomness={0.6}
        cameraDistance={20}
      />

      <div className="qkd-page">
        <motion.div className="qkd-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >

          {/* Header */}
          <header className="qkd-header">
            <motion.h1 className="qkd-title" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
              Quantum Key Distribution (BB84 Protocol)
            </motion.h1>
            <motion.p className="qkd-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
              Generate a secure quantum key using the BB84 protocol. Station (Alice) and Satellite (Bob) create and measure qubits to establish a shared secret key.
            </motion.p>
          </header>

          {/* Controls */}
          <motion.div className="controls-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
            <div className="control-group">
              <label className="control-label">Number of Qubits:</label>
              <select value={numQubits} onChange={(e) => setNumQubits(parseInt(e.target.value))} className="control-select">
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="control-group">
              <label className="control-label">Simulate Eve:</label>
              <div className="toggle-container">
                <input type="checkbox" id="eve-toggle" checked={simulateEve} onChange={(e) => setSimulateEve(e.target.checked)} className="toggle-input" />
                <label htmlFor="eve-toggle" className="toggle-label">
                  <span className="toggle-text">{simulateEve ? 'Yes' : 'No'}</span>
                </label>
              </div>
            </div>
            <button className="run-qkd-button" onClick={handleRunQKD} disabled={isLoading}>
              {isLoading ? 'Running QKD...' : 'Run QKD'}
            </button>
          </motion.div>

          {/* Error */}
          {error && <motion.div className="error-message" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>❌ {error}</motion.div>}

          {/* Results */}
          {results && (
            <motion.div className="results-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h2 className="results-title">QKD Results</h2>

              <div className="results-grid">
                {/* QKD Key */}
                <div className="result-card">
                  <h3>QKD Key</h3>
                  <div className="key-display">{results.qkd_key.split('').map((bit, i) => <span key={i} className="key-bit">{bit}</span>)}</div>
                  <p className="key-length">Length: {results.qkd_key.length} bits</p>
                </div>

                {/* QBER */}
                <div className="result-card">
                  <h3>Quantum Bit Error Rate (QBER)</h3>
                  <div className="qber-display">
                    <div className="qber-bar"><div className="qber-fill" style={{ width: `${results.qber * 100}%` }}></div></div>
                    <span className="qber-value">{(results.qber * 100).toFixed(2)}%</span>
                  </div>
                  <p className="qber-status">{results.qber < 0.11 && results.secure ? '✅ Secure' : '⚠️ Insecure'}</p>
                </div>

                {/* Statistics */}
                <div className="result-card">
                  <h3>Statistics</h3>
                  <div className="stats-list">
                    <div className="stat-item"><span className="stat-label">Total Qubits:</span> <span className="stat-value">{numQubits}</span></div>
                    <div className="stat-item"><span className="stat-label">Sifted Bits:</span> <span className="stat-value">{results.sifted_bits?.length || 0}</span></div>
                    <div className="stat-item"><span className="stat-label">Eve Present:</span> <span className="stat-value">{simulateEve ? 'Yes' : 'No'}</span></div>
                    <div className="stat-item"><span className="stat-label">QKD Secure:</span> <span className="stat-value">{results.secure ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>
              </div>

              {/* Alice vs Bob Table */}
              {results.alice_bits && results.bob_bits && (
                <div className="comparison-section">
                  <h3>Alice vs Bob Bits (First 20 Qubits)</h3>
                  <div className="table-container">
                    <table className="comparison-table">
                      <thead>
                        <tr><th>#</th><th>Alice Basis</th><th>Alice Bit</th><th>Bob Basis</th><th>Bob Bit</th><th>Match</th></tr>
                      </thead>
                      <tbody>
                        {results.alice_bits.slice(0,20).map((aBit,i) => (
                          <tr key={i}>
                            <td>{i+1}</td>
                            <td>{results.alice_bases[i]}</td>
                            <td>{aBit}</td>
                            <td>{results.bob_bases[i]}</td>
                            <td>{results.bob_bits[i]}</td>
                            <td className={aBit===results.bob_bits[i] ? 'match-yes':'match-no'}>{aBit===results.bob_bits[i] ? '✓':'✗'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Circuit */}
              {results.circuit && (
                <div className="circuit-section">
                  <h3>Quantum Circuit</h3>
                  <img src={`data:image/png;base64,${results.circuit}`} alt="Quantum Circuit" className="circuit-image"/>
                </div>
              )}

              {/* Histogram */}
              {histogramData.length > 0 && (
                <div className="histogram-section">
                  <h3>Alice-Bob Matching Histogram</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={histogramData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#667eea" /></BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bloch Spheres */}
              {blochPairs.length > 0 && (
                <div className="bloch-section">
                  <h3>Bloch Spheres (First 2 Qubits)</h3>
                  <div className="bloch-gallery">
                    {blochPairs.map((pair,index) => (
                      <div className="bloch-pair" key={index}>
                        <div className="bloch-item"><img src={`data:image/png;base64,${pair.alice}`} alt={`Alice Qubit ${index+1}`} /><p className="bloch-label">Alice Qubit {index+1}</p></div>
                        <div className="bloch-item"><img src={`data:image/png;base64,${pair.bob}`} alt={`Bob Qubit ${index+1}`} /><p className="bloch-label">Bob Qubit {index+1}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proceed / Regenerate */}
              <div className="proceed-section">
                {results.secure && results.qber < 0.11 ? (
                  <button className="proceed-button" onClick={handleProceedToSuperdense}>Go to Superdense Coding →</button>
                ) : (
                  <button className="run-qkd-button" onClick={handleGenerateSecureKey} disabled={isLoading}>Generate Another Key</button>
                )}
              </div>
            </motion.div>
          )}

          {/* Back */}
          <div className="navigation-section">
            <button onClick={handleBackToHome} className="back-button">← Back to Home</button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
