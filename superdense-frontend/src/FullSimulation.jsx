import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Particles from './Particles';
import config from './config';
import './FullSimulation.css';

export default function FullSimulation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [qkdKey, setQkdKey] = useState('');
  const [message, setMessage] = useState('00');
  const [simulateEve, setSimulateEve] = useState(false);

  useEffect(() => {
    if (location.state) {
      setQkdKey(location.state.qkdKey || '');
      setMessage(location.state.message || '00');
      setSimulateEve(location.state.simulateEve || false);
    }
  }, [location.state]);

  const handleRunFullSimulation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.application.baseURL}/full-simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          num_qubits: 50,
          qkd_eve: false,
          sdc_eve: simulateEve
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to run full simulation');
      }
    } catch (err) {
      setError('Network error: Unable to connect to backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSuperdense = () => {
    navigate('/superdense-coding');
  };

  const handleGoToResults = () => {
    navigate('/results-analysis', {
      state: {
        fullResults: results,
        qkdKey: qkdKey,
        message: message,
        simulateEve: simulateEve
      }
    });
  };

  // Normalize histogram keys into two-character strings (00, 01, 10, 11)
  const histogramData = results?.sdc?.histogram
    ? Object.entries(results.sdc.histogram)
        .map(([key, value]) => ({ name: String(key).trim().padStart(2, '0'), value }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const sdcEve = simulateEve; // for styling consistency
  const entDestroyed = typeof results?.sdc?.entanglement_status === 'string' && results.sdc.entanglement_status.toLowerCase().includes('destroyed');
  const commGarbled = typeof results?.sdc?.communication_status === 'string' && results.sdc.communication_status.toLowerCase().includes('garbled');

  return (
    <>
      <Particles 
        particleCount={200}
        particleSpread={10}
        speed={0.2}
        particleColors={["#667eea", "#764ba2", "#f093fb", "#22d3ee"]}
        moveParticlesOnHover={true}
        particleHoverFactor={2}
        alphaParticles={true}
        particleBaseSize={60}
        sizeRandomness={0.6}
        cameraDistance={20}
        disableRotation={false}
      />
      
      <div className="full-simulation-page">
        <motion.div 
          className="full-simulation-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <header className="full-simulation-header">
            <motion.h1 
              className="full-simulation-title"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              End-to-End Simulation
            </motion.h1>
            
            <motion.p 
              className="full-simulation-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Complete satellite-ground communication simulation combining QKD and superdense coding
            </motion.p>
          </header>

          {/* Persistent Eve banner if requested for SDC stage */}
          {sdcEve && (
            <div className="eve-persistent-banner">
              ⚠️ Eve has interfered during Superdense Coding. Communication may be compromised.
            </div>
          )}

          {/* Simulation Parameters */}
          <motion.div 
            className="parameters-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h3>Simulation Parameters</h3>
            <div className="parameters-grid">
              <div className="parameter-item">
                <span className="parameter-label">QKD Key:</span>
                <span className="parameter-value">{qkdKey || 'Generated automatically in this step'}</span>
              </div>
              <div className="parameter-item">
                <span className="parameter-label">Message:</span>
                <span className="parameter-value">{message}</span>
              </div>
              <div className="parameter-item">
                <span className="parameter-label">Eve During SDC:</span>
                <span className="parameter-value">{simulateEve ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </motion.div>

          {/* Run Simulation Button */}
          <motion.div 
            className="run-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <button 
              className="run-full-simulation-button"
              onClick={handleRunFullSimulation}
              disabled={isLoading}
            >
              {isLoading ? 'Running Full Simulation...' : 'Run Full Simulation'}
            </button>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              ❌ {error}
            </motion.div>
          )}

          {/* Results */}
          {results && (
            <motion.div 
              className="results-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="results-title">Full Simulation Results</h2>
              
              {/* Step Cards */}
              <div className="step-cards-section">
                <h3>Simulation Steps</h3>
                
                {/* QKD Step */}
                <div className="step-card">
                  <div className="step-icon">🔑</div>
                  <div className="step-content">
                    <h4>QKD Key Generation</h4>
                    <div className="step-details">
                      <p><strong>Key:</strong> {results.qkd?.qkd_key}</p>
                      <p><strong>QBER:</strong> {(results.qkd?.qber * 100).toFixed(2)}%</p>
                      <p><strong>Sifted Bits:</strong> {results.qkd?.sifted_bits?.length || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Encryption Step */}
                <div className="step-card">
                  <div className="step-icon">🔒</div>
                  <div className="step-content">
                    <h4>Encryption</h4>
                    <div className="step-details">
                      <p><strong>Original Message:</strong> {message}</p>
                      <p><strong>Encrypted:</strong> {results.sdc?.encrypted_message?.join('') || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Entanglement Step */}
                <div className="step-card">
                  <div className="step-icon">⚛️</div>
                  <div className="step-content">
                    <h4>Entanglement</h4>
                    <div className="step-details">
                      <p><strong>Status:</strong> {entDestroyed ? '❌ Entanglement broken by Eve' : '✅ Entanglement established between qubits'}</p>
                      <p><strong>Qubits:</strong> 2 entangled qubits prepared</p>
                    </div>
                  </div>
                </div>

                {/* Communication Step */}
                <div className="step-card">
                  <div className="step-icon">📡</div>
                  <div className="step-content">
                    <h4>Communication</h4>
                    <div className="step-details">
                      <p><strong>Status:</strong> {commGarbled ? '⚠️ Communication garbled due to Eve' : '✅ Message transmitted via entangled pair'}</p>
                      <p><strong>Channel:</strong> Quantum channel transmission</p>
                    </div>
                  </div>
                </div>

                {/* Decryption Step */}
                <div className="step-card">
                  <div className="step-icon">🔓</div>
                  <div className="step-content">
                    <h4>Decryption</h4>
                    <div className="step-details">
                      <p><strong>Process:</strong> Bell state measurement</p>
                      <p><strong>Result:</strong> Message decoded from entangled state</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visuals: Circuit and Bloch Spheres */}
              {results.sdc?.circuit && (
                <div className="circuit-section">
                  <h3>Quantum Circuit</h3>
                  <img src={`data:image/png;base64,${results.sdc.circuit}`} alt="Circuit" className="circuit-image" />
                </div>
              )}

              {results.sdc?.bloch_spheres?.length > 0 && (
                <div className="bloch-section">
                  <h3>Bloch Spheres</h3>
                  <div className="bloch-gallery">
                    {results.sdc.bloch_spheres.map((b, i) => (
                      <div key={i} className="bloch-item">
                        <img src={`data:image/png;base64,${b}`} alt={`Qubit ${i + 1}`} />
                        <p>Qubit {i + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Summary Block */}
              <div className="final-summary-section">
                <h3>Final Summary</h3>
                
                {/* Original vs Encrypted vs Decrypted */}
                <div className="message-comparison">
                  <div className="message-item">
                    <h4>Original Message</h4>
                    <div className="message-display">
                      {message.split('').map((bit, index) => (
                        <span key={index} className="message-bit original">{bit}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="message-item">
                    <h4>Encrypted Message</h4>
                    <div className="message-display">
                      {results.sdc?.encrypted_message?.map((bit, index) => (
                        <span key={index} className="message-bit encrypted">{bit}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="message-item">
                    <h4>Decrypted Message</h4>
                    <div className="message-display">
                      {message.split('').map((bit, index) => (
                        <span key={index} className="message-bit decrypted">{bit}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comparison Histogram */}
                <div className="comparison-histogram">
                  <h4>Measurement Results {sdcEve ? '(With Tampering)' : '(No Eve)'}</h4>
                  <div className="histogram-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={histogramData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill={sdcEve ? '#ef4444' : '#667eea'} label={{ position: 'top' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Transmission Status */}
                <div className="success-status">
                  <h4>Transmission Status</h4>
                  <div className={`status-indicator ${entDestroyed || commGarbled ? 'warning' : 'success'}`}>
                    {entDestroyed || commGarbled ? '⚠️ Communication compromised' : '✅ Communication Successful'}
                  </div>
                  <p className="status-description">
                    {entDestroyed || commGarbled
                      ? 'Eve likely interfered with the channel. Results show degraded fidelity.'
                      : 'The message was successfully transmitted and decoded using quantum entanglement.'}
                  </p>
                </div>
              </div>

              {/* Proceed Button */}
              <div className="proceed-section">
                <button 
                  className="proceed-button"
                  onClick={handleGoToResults}
                >
                  View Detailed Analysis →
                </button>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="navigation-section">
            <button onClick={handleBackToSuperdense} className="back-button">
              ← Back to Superdense Coding
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
