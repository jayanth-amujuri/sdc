import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
          message,
          num_qubits: 50,
          qkd_eve: false,
          sdc_eve: simulateEve,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to run full simulation');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Network error: Unable to connect to backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSuperdense = () => navigate('/superdense-coding');
  const handleGoToResults = () =>
    navigate('/results-analysis', { state: { fullResults: results, qkdKey, message, simulateEve } });

  // Histogram formatting
  const histogramData = results?.sdc?.histogram
    ? Object.entries(results.sdc.histogram)
        .map(([key, value]) => ({ name: String(key).trim().padStart(2, '0'), value }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const entDestroyed = results?.sdc?.entanglement_status?.toLowerCase().includes('destroyed');
  const commGarbled = results?.sdc?.communication_status?.toLowerCase().includes('garbled');

  return (
    <>
      <Particles
        particleCount={200}
        particleSpread={10}
        speed={0.2}
        particleColors={['#667eea', '#764ba2', '#f093fb', '#22d3ee']}
        moveParticlesOnHover
        particleHoverFactor={2}
        alphaParticles
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

          {simulateEve && (
            <div className="eve-persistent-banner">
              ⚠ Eve has interfered during Superdense Coding. Communication may be compromised.
            </div>
          )}

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

          <motion.div
            className="run-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.button
              className="run-full-simulation-button"
              onClick={handleRunFullSimulation}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              {isLoading ? 'Running Full Simulation...' : 'Run Full Simulation'}
            </motion.button>
          </motion.div>

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              ❌ {error}
            </motion.div>
          )}

          {results && (
            <motion.div
              className="results-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="results-title">Full Simulation Results</h2>

              <div className="step-cards-section">
                <h3>Simulation Steps</h3>

                <div className="step-card">
                  <div className="step-icon">🔑</div>
                  <div className="step-content">
                    <h4>QKD Key Generation</h4>
                    <p><strong>Key:</strong> {results.qkd?.qkd_key}</p>
                    <p><strong>QBER:</strong> {(results.qkd?.qber * 100).toFixed(2)}%</p>
                    <p><strong>Sifted Bits:</strong> {results.qkd?.sifted_bits?.length || 0}</p>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-icon">🔒</div>
                  <div className="step-content">
                    <h4>Encryption</h4>
                    <p><strong>Original:</strong> {message}</p>
                    <p><strong>Encrypted:</strong> {results.sdc?.encrypted_message?.join('') || 'N/A'}</p>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-icon">⚛</div>
                  <div className="step-content">
                    <h4>Entanglement</h4>
                    <p><strong>Status:</strong> {entDestroyed ? '❌ Broken' : '✅ Established'}</p>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-icon">📡</div>
                  <div className="step-content">
                    <h4>Communication</h4>
                    <p><strong>Status:</strong> {commGarbled ? '⚠ Garbled' : '✅ Successful'}</p>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-icon">🔓</div>
                  <div className="step-content">
                    <h4>Decryption</h4>
                    <p>Message decoded from entangled state</p>
                  </div>
                </div>
              </div>

              <div className="final-summary-section">
                <h3>Final Summary</h3>
                <p>
                  {entDestroyed || commGarbled
                    ? '⚠ Communication compromised by Eve'
                    : '✅ Communication Successful'}
                </p>
              </div>

              <div className="proceed-section">
                <button className="proceed-button" onClick={handleGoToResults}>
                  View Detailed Analysis →
                </button>
              </div>
            </motion.div>
          )}

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
