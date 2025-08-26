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
  const [simulateEve, setSimulateEve] = useState(false);

  useEffect(() => {
    if (location.state) {
      setQkdKey(location.state.qkdKey || '');
      setSimulateEve(location.state.simulateEve || false);
    }
  }, [location.state]);

  const handleSendMessage = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${config.application.baseURL}/sdc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          qkd_key: qkdKey,
          eve: simulateEve
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to run superdense coding');
      }
    } catch (err) {
      setError('Network error: Unable to connect to backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToFullSimulation = () => {
    navigate('/full-simulation', { 
      state: { 
        qkdKey: qkdKey,
        message: message,
        simulateEve: simulateEve,
        sdcResults: results
      } 
    });
  };

  const handleBackToQKD = () => {
    navigate('/qkd-simulation');
  };

  // Prepare histogram data for Recharts
  const histogramData = results?.histogram ? 
    Object.entries(results.histogram).map(([key, value]) => ({
      name: key,
      value: value
    })) : [];

  // Format density matrix for display
  const formatDensityMatrix = (matrix) => {
    if (!matrix) return null;
    return matrix.map(row => 
      row.map(complex => {
        // Handle both complex objects and complex numbers
        let real, imag;
        if (typeof complex === 'object' && complex.real !== undefined && complex.imaginary !== undefined) {
          // New format from backend: {real: number, imaginary: number}
          real = Math.round(complex.real * 1000) / 1000;
          imag = Math.round(complex.imaginary * 1000) / 1000;
        } else if (typeof complex === 'number') {
          // Fallback for simple numbers
          real = Math.round(complex * 1000) / 1000;
          imag = 0;
        } else {
          // Fallback for other cases
          real = 0;
          imag = 0;
        }
        return `${real}${imag >= 0 ? '+' : ''}${imag}i`;
      })
    );
  };

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
      
      <div className="sdc-page">
        <motion.div 
          className="sdc-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
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
              Use the quantum key from QKD to encode and transmit a 2-bit message 
              using entangled qubits through superdense coding protocol.
            </motion.p>
          </header>

          {/* QKD Key Display */}
          {qkdKey && (
            <motion.div 
              className="qkd-key-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h3>QKD Key from Previous Step</h3>
              <div className="qkd-key-display">
                {qkdKey.split('').map((bit, index) => (
                  <span key={index} className="qkd-key-bit">{bit}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Controls */}
          <motion.div 
            className="controls-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="control-group">
              <label className="control-label">Enter 2-bit Message:</label>
              <select 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                className="control-select"
              >
                <option value="00">00</option>
                <option value="01">01</option>
                <option value="10">10</option>
                <option value="11">11</option>
              </select>
            </div>

            <div className="control-group">
              <label className="control-label">Eve Present:</label>
              <span className="eve-status">{simulateEve ? 'Yes' : 'No'}</span>
            </div>

            <button 
              className="send-message-button"
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              {isLoading ? 'Sending Message...' : 'Send Message'}
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
              <h2 className="results-title">Superdense Coding Results</h2>
              
              {/* Encrypted Message */}
              <div className="encrypted-section">
                <h3>Encrypted Message</h3>
                <div className="message-display">
                  <span className="message-bits">
                    {results.encrypted_message && results.encrypted_message.map((bit, index) => (
                      <span key={index} className="message-bit encrypted">{bit}</span>
                    ))}
                  </span>
                </div>
                <p className="message-description">Encrypted bits sent through quantum channel</p>
              </div>

              {/* Status Messages */}
              <div className="status-section">
                <div className="status-card">
                  <h4>Entanglement Status</h4>
                  <p className="status-text">{results.entanglement_status}</p>
                </div>
                <div className="status-card">
                  <h4>Communication Status</h4>
                  <p className="status-text">{results.communication_status}</p>
                </div>
              </div>

              {/* Circuit Images */}
              <div className="circuit-section">
                <h3>Quantum Circuits</h3>
                <div className="circuit-container">
                  {results.circuit && (
                    <img 
                      src={`data:image/png;base64,${results.circuit}`}
                      alt="Quantum Circuit"
                      className="circuit-image"
                    />
                  )}
                </div>
              </div>

              {/* Histograms Side by Side */}
              <div className="histogram-section">
                <h3>Measurement Results</h3>
                <div className="histogram-container">
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
              </div>

              {/* Bloch Spheres for Both Qubits */}
              {results.bloch_spheres && results.bloch_spheres.length > 0 && (
                <div className="bloch-section">
                  <h3>Bloch Spheres for Both Qubits</h3>
                  <div className="bloch-gallery">
                    {results.bloch_spheres.map((blochSphere, index) => (
                      <div key={index} className="bloch-item">
                        <img 
                          src={`data:image/png;base64,${blochSphere}`}
                          alt={`Bloch Sphere Qubit ${index + 1}`}
                          className="bloch-image"
                        />
                        <p className="bloch-label">Qubit {index + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Density Matrix */}
              {results.density_matrix && (
                <div className="density-section">
                  <h3>Density Matrix (Pretty-Printed)</h3>
                  <div className="density-container">
                    <table className="density-table">
                      <tbody>
                        {formatDensityMatrix(results.density_matrix)?.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((element, colIndex) => (
                              <td key={colIndex} className="density-element">
                                {element}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Proceed Button */}
              <div className="proceed-section">
                <button 
                  className="proceed-button"
                  onClick={handleProceedToFullSimulation}
                >
                  Go to Full Simulation →
                </button>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="navigation-section">
            <button onClick={handleBackToQKD} className="back-button">
              ← Back to QKD
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
